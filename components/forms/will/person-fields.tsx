"use client";

import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Field } from "@/components/forms/will/field";
import { PROVINCE_OPTIONS } from "@/types";
import { type Person } from "@/types/will";

/** Editable block for a named person (executor, guardian, etc.). */
export function PersonFields({
  value,
  onChange,
}: {
  value: Person;
  onChange: (person: Person) => void;
}) {
  const set = (key: keyof Person, val: string) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="First name">
        <Input
          value={value.first_name}
          onChange={(e) => set("first_name", e.target.value)}
        />
      </Field>
      <Field label="Last name">
        <Input
          value={value.last_name}
          onChange={(e) => set("last_name", e.target.value)}
        />
      </Field>
      <Field label="Relationship">
        <Input
          value={value.relationship}
          onChange={(e) => set("relationship", e.target.value)}
          placeholder="e.g. Spouse, Sibling, Friend"
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={value.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label="Phone">
        <Input
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </Field>
      <Field label="City">
        <Input
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </Field>
      <Field label="Province">
        <Dropdown
          value={value.province}
          onChange={(v) => set("province", v)}
          options={PROVINCE_OPTIONS}
          placeholder="Select…"
        />
      </Field>
    </div>
  );
}
