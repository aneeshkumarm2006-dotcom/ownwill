"use client";

import { DocWizard, type DocWizardConfig, type StepCtx } from "@/components/docs/doc-wizard";
import { docStr } from "@/components/docs/fields";
import { Field, Input } from "@/components/ui-kit";
import { RepeatableList } from "@/components/forms/will/repeatable-list";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function List({
  ctx, k, addLabel, makeEmpty, fields,
}: {
  ctx: StepCtx;
  k: string;
  addLabel: string;
  makeEmpty: () => Row;
  fields: { key: string; label: string; type?: string }[];
}) {
  const items = (ctx.data[k] as Row[]) ?? [];
  return (
    <RepeatableList<Row>
      items={items}
      makeEmpty={makeEmpty}
      onChange={(next) => ctx.set(k, next)}
      addLabel={addLabel}
      emptyText="None added yet."
      renderItem={(item, update) => (
        <div className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input type={f.type ?? "text"} value={item[f.key] ?? ""} onChange={(e) => update({ [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
            </Field>
          ))}
        </div>
      )}
    />
  );
}

const config: DocWizardConfig = {
  type: "asset_list",
  table: "asset_list_data",
  title: "Asset List",
  breadcrumb: "My documents",
  finishHref: "/documents/asset_list",
  defaults: {
    properties: [], vehicles: [], bank_accounts: [], investments: [], insurance_policies: [], digital_assets: [],
    will_location: "", passport_location: "", sin_location: "",
    lawyer_name: "", lawyer_phone: "", accountant_name: "", accountant_phone: "", financial_advisor_name: "", financial_advisor_phone: "",
  },
  steps: [
    {
      title: "Property & vehicles", description: "What you own.", tip: "A living reference for your executor — not a legal document.",
      render: (ctx) => (
        <div className="stack g-6">
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Properties</h3>
            <List ctx={ctx} k="properties" addLabel="Add property" makeEmpty={() => ({ address: "", city: "", province: "", ownership_type: "", estimated_value: "" })}
              fields={[{ key: "address", label: "Address" }, { key: "city", label: "City" }, { key: "ownership_type", label: "Ownership type" }, { key: "estimated_value", label: "Estimated value", type: "number" }]} />
          </section>
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Vehicles</h3>
            <List ctx={ctx} k="vehicles" addLabel="Add vehicle" makeEmpty={() => ({ make: "", model: "", year: "", vin: "" })}
              fields={[{ key: "make", label: "Make" }, { key: "model", label: "Model" }, { key: "year", label: "Year" }, { key: "vin", label: "VIN" }]} />
          </section>
        </div>
      ),
    },
    {
      title: "Accounts & investments", description: "Where your money lives.", tip: "Last 4 digits only — never full account numbers.",
      render: (ctx) => (
        <div className="stack g-6">
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Bank accounts</h3>
            <List ctx={ctx} k="bank_accounts" addLabel="Add account" makeEmpty={() => ({ bank_name: "", account_type: "", last_4_digits: "" })}
              fields={[{ key: "bank_name", label: "Bank" }, { key: "account_type", label: "Account type" }, { key: "last_4_digits", label: "Last 4 digits" }]} />
          </section>
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Investments</h3>
            <List ctx={ctx} k="investments" addLabel="Add investment" makeEmpty={() => ({ institution: "", type: "", approximate_value: "" })}
              fields={[{ key: "institution", label: "Institution" }, { key: "type", label: "Type (RRSP, TFSA…)" }, { key: "approximate_value", label: "Approx. value", type: "number" }]} />
          </section>
        </div>
      ),
    },
    {
      title: "Insurance & digital", description: "Policies and online accounts.", tip: "Digital assets include crypto, domains, and online accounts.",
      render: (ctx) => (
        <div className="stack g-6">
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Insurance policies</h3>
            <List ctx={ctx} k="insurance_policies" addLabel="Add policy" makeEmpty={() => ({ provider: "", type: "", policy_number: "", beneficiary: "" })}
              fields={[{ key: "provider", label: "Provider" }, { key: "type", label: "Type" }, { key: "policy_number", label: "Policy #" }, { key: "beneficiary", label: "Beneficiary" }]} />
          </section>
          <section className="stack g-3">
            <h3 className="t-h5" style={{ margin: 0 }}>Digital assets</h3>
            <List ctx={ctx} k="digital_assets" addLabel="Add digital asset" makeEmpty={() => ({ platform: "", type: "", notes: "" })}
              fields={[{ key: "platform", label: "Platform" }, { key: "type", label: "Type" }, { key: "notes", label: "Notes" }]} />
          </section>
        </div>
      ),
    },
    {
      title: "Documents & contacts", description: "Where things are, and who to call.", tip: "Tell your executor where your will and key papers are kept.",
      render: ({ data, set }) => (
        <div className="stack g-4">
          <div className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <Field label="Will location"><Input value={docStr(data, "will_location")} onChange={(e) => set("will_location", e.target.value)} /></Field>
            <Field label="Passport location"><Input value={docStr(data, "passport_location")} onChange={(e) => set("passport_location", e.target.value)} /></Field>
            <Field label="SIN card location"><Input value={docStr(data, "sin_location")} onChange={(e) => set("sin_location", e.target.value)} /></Field>
          </div>
          {[
            ["lawyer", "Lawyer"], ["accountant", "Accountant"], ["financial_advisor", "Financial advisor"],
          ].map(([k, label]) => (
            <div key={k} className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label={`${label} name`}><Input value={docStr(data, `${k}_name`)} onChange={(e) => set(`${k}_name`, e.target.value)} /></Field>
              <Field label={`${label} phone`}><Input value={docStr(data, `${k}_phone`)} onChange={(e) => set(`${k}_phone`, e.target.value)} /></Field>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Review", description: "A quick summary.", tip: "You can update this list anytime — it stays current for your family.",
      render: ({ data }) => {
        const count = (k: string) => ((data[k] as unknown[]) ?? []).length;
        return (
          <div className="stack g-2 t-body-sm">
            {[["properties", "Properties"], ["vehicles", "Vehicles"], ["bank_accounts", "Bank accounts"], ["investments", "Investments"], ["insurance_policies", "Insurance policies"], ["digital_assets", "Digital assets"]].map(([k, label]) => (
              <div key={k} className="row" style={{ justifyContent: "space-between" }}><span className="muted">{label}</span><span>{count(k)}</span></div>
            ))}
          </div>
        );
      },
    },
  ],
};

export default function AssetsPage() {
  return <DocWizard config={config} />;
}
