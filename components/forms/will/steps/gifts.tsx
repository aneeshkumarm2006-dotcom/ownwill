"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/will/field";
import { RepeatableList } from "@/components/forms/will/repeatable-list";
import { YesNo } from "@/components/forms/will/yes-no";
import { useWillStore } from "@/store/will";
import { emptyGift, type SpecificGift } from "@/types/will";

export function GiftsStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);
  const [hasGifts, setHasGifts] = useState(data.specific_gifts.length > 0);

  const toggle = (v: boolean) => {
    setHasGifts(v);
    if (!v) patch({ specific_gifts: [] });
    else if (data.specific_gifts.length === 0)
      patch({ specific_gifts: [emptyGift()] });
  };

  return (
    <div className="space-y-5">
      <Field label="Do you want to leave specific gifts?">
        <YesNo value={hasGifts} onChange={toggle} />
      </Field>

      {hasGifts ? (
        <RepeatableList<SpecificGift>
          items={data.specific_gifts}
          makeEmpty={emptyGift}
          onChange={(specific_gifts) => patch({ specific_gifts })}
          addLabel="Add gift"
          renderItem={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Item">
                <Input
                  value={item.item}
                  onChange={(e) => update({ item: e.target.value })}
                  placeholder="e.g. Grandmother's ring"
                />
              </Field>
              <Field label="Recipient name">
                <Input
                  value={item.recipient_name}
                  onChange={(e) => update({ recipient_name: e.target.value })}
                />
              </Field>
              <Field label="Relationship">
                <Input
                  value={item.recipient_relationship}
                  onChange={(e) =>
                    update({ recipient_relationship: e.target.value })
                  }
                />
              </Field>
            </div>
          )}
        />
      ) : null}
    </div>
  );
}
