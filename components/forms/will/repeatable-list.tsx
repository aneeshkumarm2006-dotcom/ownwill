"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Generic add/remove list for repeating wizard items (beneficiaries, children,
 * pets, gifts, donations). The caller renders each item's fields.
 */
/**
 * Stable per-item identifier. Wizard types (Beneficiary, Child, …) embed `_id`
 * in their `emptyXxx()` factories so React's key stays stable across edits.
 * For loosely-typed callers (asset list rows) we fall back to a generated id
 * the first time we render the item so the key still doesn't shift on edit.
 */
const fallbackId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function RepeatableList<T>({
  items,
  makeEmpty,
  onChange,
  addLabel,
  emptyText,
  renderItem,
}: {
  items: T[];
  makeEmpty: () => T;
  onChange: (items: T[]) => void;
  addLabel: string;
  emptyText?: string;
  renderItem: (
    item: T,
    update: (patch: Partial<T>) => void,
    index: number,
  ) => React.ReactNode;
}) {
  const update = (i: number, patch: Partial<T>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    const next = makeEmpty();
    if (next && typeof next === "object" && !("_id" in next)) {
      (next as { _id?: string })._id = fallbackId();
    }
    onChange([...items, next]);
  };

  // Derive a friendly noun from "Add beneficiary" → "beneficiaries" so the
  // empty state reads naturally when the caller doesn't supply `emptyText`.
  const noun = addLabel.replace(/^\+?\s*Add\s+/i, "").trim() || "items";
  const defaultEmpty = `No ${noun} yet — click Add to start.`;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText ?? defaultEmpty}</p>
      ) : null}

      {items.map((item, i) => {
        const id = (item as { _id?: string })?._id;
        return (
          <Card key={id ?? i}>
            <CardContent className="space-y-3 pt-5">
              {renderItem(item, (patch) => update(i, patch), i)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        + {addLabel}
      </Button>
    </div>
  );
}
