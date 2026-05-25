"use client";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/forms/will/field";
import { RepeatableList } from "@/components/forms/will/repeatable-list";
import { useWillStore } from "@/store/will";
import {
  beneficiaryTotal,
  emptyBeneficiary,
  type Beneficiary,
} from "@/types/will";

export function BeneficiariesStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);
  const total = beneficiaryTotal(data.beneficiaries);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Who inherits your estate, and what share each person receives.
        Percentages must add up to 100%.
      </p>

      <RepeatableList<Beneficiary>
        items={data.beneficiaries}
        makeEmpty={emptyBeneficiary}
        onChange={(beneficiaries) => patch({ beneficiaries })}
        addLabel="Add beneficiary"
        emptyText="No beneficiaries added yet."
        renderItem={(item, update) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                value={item.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Relationship">
              <Input
                value={item.relationship}
                onChange={(e) => update({ relationship: e.target.value })}
              />
            </Field>
            <Field label="Share (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={item.percentage || ""}
                onChange={(e) => update({ percentage: Number(e.target.value) })}
              />
            </Field>
            <Field label="Date of birth (optional)">
              <DatePicker value={item.dob} onChange={(v) => update({ dob: v })} />
            </Field>
          </div>
        )}
      />

      {data.beneficiaries.length > 0 ? (
        <p
          className={
            total === 100
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          Total: {total}% {total === 100 ? "✓" : "— must equal 100%"}
        </p>
      ) : null}
    </div>
  );
}
