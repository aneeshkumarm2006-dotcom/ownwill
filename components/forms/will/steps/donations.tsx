"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/forms/will/field";
import { RepeatableList } from "@/components/forms/will/repeatable-list";
import { YesNo } from "@/components/forms/will/yes-no";
import { useWillStore } from "@/store/will";
import { emptyDonation, type CharitableDonation } from "@/types/will";

export function DonationsStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);
  const [hasDonations, setHasDonations] = useState(
    data.charitable_donations.length > 0,
  );

  const toggle = (v: boolean) => {
    setHasDonations(v);
    if (!v) patch({ charitable_donations: [] });
    else if (data.charitable_donations.length === 0)
      patch({ charitable_donations: [emptyDonation()] });
  };

  return (
    <div className="space-y-5">
      <Field label="Do you want to leave charitable donations?">
        <YesNo value={hasDonations} onChange={toggle} />
      </Field>

      {hasDonations ? (
        <RepeatableList<CharitableDonation>
          items={data.charitable_donations}
          makeEmpty={emptyDonation}
          onChange={(charitable_donations) => patch({ charitable_donations })}
          addLabel="Add donation"
          renderItem={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Organization">
                <Input
                  value={item.organization}
                  onChange={(e) => update({ organization: e.target.value })}
                />
              </Field>
              <Field
                label={item.is_percentage ? "Share of estate (%)" : "Amount (CAD)"}
              >
                <Input
                  type="number"
                  min={0}
                  value={item.amount || ""}
                  onChange={(e) => update({ amount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Gift type">
                <NativeSelect
                  value={item.is_percentage ? "percentage" : "amount"}
                  onChange={(e) => {
                    const nextIsPercentage = e.target.value === "percentage";
                    if (nextIsPercentage === item.is_percentage) return;
                    // A "$5,000" amount makes no sense as "5,000% of the estate" —
                    // clear the field so the user re-enters in the new unit.
                    update({ is_percentage: nextIsPercentage, amount: 0 });
                  }}
                >
                  <option value="amount">Fixed amount</option>
                  <option value="percentage">Percentage of estate</option>
                </NativeSelect>
              </Field>
            </div>
          )}
        />
      ) : null}
    </div>
  );
}
