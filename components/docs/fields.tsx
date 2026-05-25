"use client";

import { Field, Input } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { PROVINCE_OPTIONS } from "@/types";
import type { DocData } from "@/lib/docs/data";

const str = (data: DocData, key: string) => (data[key] as string) ?? "";

/** A person captured as flat columns: `${prefix}_first_name`, etc. */
export function FlatPerson({
  data,
  set,
  prefix,
}: {
  data: DocData;
  set: (key: string, value: unknown) => void;
  prefix: string;
}) {
  return (
    <div className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <Field label="First name"><Input value={str(data, `${prefix}_first_name`)} onChange={(e) => set(`${prefix}_first_name`, e.target.value)} /></Field>
      <Field label="Last name"><Input value={str(data, `${prefix}_last_name`)} onChange={(e) => set(`${prefix}_last_name`, e.target.value)} /></Field>
      <Field label="Relationship"><Input value={str(data, `${prefix}_relationship`)} onChange={(e) => set(`${prefix}_relationship`, e.target.value)} placeholder="e.g. Spouse" /></Field>
      <Field label="Email"><Input type="email" value={str(data, `${prefix}_email`)} onChange={(e) => set(`${prefix}_email`, e.target.value)} /></Field>
      <Field label="Phone"><Input value={str(data, `${prefix}_phone`)} onChange={(e) => set(`${prefix}_phone`, e.target.value)} /></Field>
      <Field label="City"><Input value={str(data, `${prefix}_city`)} onChange={(e) => set(`${prefix}_city`, e.target.value)} /></Field>
      <Field label="Province">
        <Dropdown value={str(data, `${prefix}_province`)} onChange={(v) => set(`${prefix}_province`, v)} options={PROVINCE_OPTIONS} placeholder="Select…" />
      </Field>
    </div>
  );
}

export { str as docStr };
