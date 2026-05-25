"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Generic add/remove list for repeating wizard items (beneficiaries, children,
 * pets, gifts, donations). The caller renders each item's fields.
 */
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
  const add = () => onChange([...items, makeEmpty()]);

  return (
    <div className="space-y-3">
      {items.length === 0 && emptyText ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : null}

      {items.map((item, i) => (
        <Card key={i}>
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
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        + {addLabel}
      </Button>
    </div>
  );
}
