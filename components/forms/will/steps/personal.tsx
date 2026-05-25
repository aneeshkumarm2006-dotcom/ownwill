"use client";

import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/forms/will/field";
import { useWillStore } from "@/store/will";
import { PROVINCE_OPTIONS, type Province } from "@/types";
import { MARITAL_STATUSES, type MaritalStatus } from "@/types/will";

const MARITAL_OPTIONS = MARITAL_STATUSES.map((m) => ({ value: m.value, label: m.label }));

export function PersonalStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);

  return (
    <div className="space-y-4">
      <Field label="Full legal name">
        <Input
          value={data.full_legal_name}
          onChange={(e) => patch({ full_legal_name: e.target.value })}
          placeholder="As it appears on your ID"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth">
          <DatePicker value={data.date_of_birth} onChange={(v) => patch({ date_of_birth: v })} />
        </Field>
        <Field label="Marital status">
          <Dropdown
            value={data.marital_status}
            onChange={(v) => patch({ marital_status: v as MaritalStatus })}
            options={MARITAL_OPTIONS}
            placeholder="Select…"
          />
        </Field>
        <Field label="City">
          <Input value={data.city} onChange={(e) => patch({ city: e.target.value })} />
        </Field>
        <Field label="Province">
          <Dropdown
            value={data.province}
            onChange={(v) => patch({ province: v as Province })}
            options={PROVINCE_OPTIONS}
            placeholder="Select…"
          />
        </Field>
      </div>
    </div>
  );
}
