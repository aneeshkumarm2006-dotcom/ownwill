"use client";

import { DocWizard, type DocWizardConfig, type StepCtx } from "@/components/docs/doc-wizard";
import { FlatPerson, docStr } from "@/components/docs/fields";
import { Field, Input, Textarea } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { PROVINCE_OPTIONS } from "@/types";

const COMPENSATION = [
  { value: "no_compensation", label: "No compensation" },
  { value: "reasonable_compensation", label: "Reasonable compensation (provincial rates)" },
  { value: "specific_amount", label: "A specific amount" },
];
const ACTIVATION = [
  { value: "incapacity_only", label: "Only if I become mentally incapable" },
  { value: "immediately", label: "Immediately upon signing" },
];

function Check({ data, set, k, label }: StepCtx & { k: string; label: string }) {
  return (
    <label className="row g-3" style={{ cursor: "pointer", padding: "6px 0" }}>
      <input type="checkbox" className="checkbox" checked={Boolean(data[k])} onChange={(e) => set(k, e.target.checked)} />
      <span className="t-body">{label}</span>
    </label>
  );
}

const config: DocWizardConfig = {
  type: "poa_property",
  table: "poa_property_data",
  title: "Power of Attorney — Property",
  breadcrumb: "My documents",
  finishHref: "/documents/poa_property",
  defaults: {
    full_legal_name: "", date_of_birth: "", province: "",
    manage_bank_accounts: true, manage_real_estate: true, manage_investments: true, manage_taxes: true,
    make_gifts: false, gift_limit_per_year: null,
    additional_powers: "", restrictions: "",
    activation_condition: "incapacity_only", requires_two_doctors_confirmation: false,
    attorney_compensation: "reasonable_compensation", compensation_amount: null,
  },
  validate: (step, data) => {
    if (step === 1 && !String(data.full_legal_name || "").trim()) return "Please enter your full legal name.";
    if (step === 2 && !docStr(data, "attorney_first_name").trim()) return "Please name your attorney.";
    return null;
  },
  steps: [
    {
      title: "About you", description: "Your details.", tip: "This POA names who manages your money and property if you can't.",
      render: ({ data, set }) => (
        <div className="stack g-4">
          <Field label="Full legal name"><Input value={docStr(data, "full_legal_name")} onChange={(e) => set("full_legal_name", e.target.value)} /></Field>
          <div className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Date of birth"><DatePicker value={docStr(data, "date_of_birth")} onChange={(v) => set("date_of_birth", v)} /></Field>
            <Field label="Province"><Dropdown value={docStr(data, "province")} onChange={(v) => set("province", v)} options={PROVINCE_OPTIONS} placeholder="Select…" /></Field>
          </div>
        </div>
      ),
    },
    {
      title: "Your attorney", description: "Who manages your finances.", tip: "Choose someone organized and trustworthy with money.",
      render: ({ data, set }) => (
        <div className="stack g-6">
          <section className="stack g-3"><h3 className="t-h5" style={{ margin: 0 }}>Attorney</h3><FlatPerson data={data} set={set} prefix="attorney" /></section>
          <section className="stack g-3"><h3 className="t-h5" style={{ margin: 0 }}>Backup attorney</h3><FlatPerson data={data} set={set} prefix="backup_attorney" /></section>
        </div>
      ),
    },
    {
      title: "Powers", description: "What your attorney can do.", tip: "Uncheck anything you'd rather not grant.",
      render: (ctx) => (
        <div className="stack g-4">
          <div>
            <Check {...ctx} k="manage_bank_accounts" label="Manage bank accounts" />
            <Check {...ctx} k="manage_real_estate" label="Buy, sell, or manage real estate" />
            <Check {...ctx} k="manage_investments" label="Manage investments" />
            <Check {...ctx} k="manage_taxes" label="File taxes and deal with the CRA" />
            <Check {...ctx} k="make_gifts" label="Make reasonable gifts on my behalf" />
          </div>
          {Boolean(ctx.data.make_gifts) && (
            <Field label="Annual gift limit (CAD, optional)"><Input type="number" value={(ctx.data.gift_limit_per_year as number) ?? ""} onChange={(e) => ctx.set("gift_limit_per_year", e.target.value ? Number(e.target.value) : null)} /></Field>
          )}
          <Field label="Additional powers (optional)"><Textarea value={docStr(ctx.data, "additional_powers")} onChange={(e) => ctx.set("additional_powers", e.target.value)} rows={3} /></Field>
          <Field label="Restrictions (optional)"><Textarea value={docStr(ctx.data, "restrictions")} onChange={(e) => ctx.set("restrictions", e.target.value)} rows={3} /></Field>
        </div>
      ),
    },
    {
      title: "Compensation & activation", description: "Pay and when it applies.", tip: "Most people allow reasonable compensation and activate only on incapacity.",
      render: ({ data, set }) => (
        <div className="stack g-4">
          <Field label="Attorney compensation"><Dropdown value={docStr(data, "attorney_compensation")} onChange={(v) => set("attorney_compensation", v)} options={COMPENSATION} /></Field>
          {docStr(data, "attorney_compensation") === "specific_amount" && (
            <Field label="Amount (CAD)"><Input type="number" value={(data.compensation_amount as number) ?? ""} onChange={(e) => set("compensation_amount", e.target.value ? Number(e.target.value) : null)} /></Field>
          )}
          <Field label="This POA takes effect"><Dropdown value={docStr(data, "activation_condition")} onChange={(v) => set("activation_condition", v)} options={ACTIVATION} /></Field>
          <label className="row g-3" style={{ cursor: "pointer" }}>
            <input type="checkbox" className="checkbox" checked={Boolean(data.requires_two_doctors_confirmation)} onChange={(e) => set("requires_two_doctors_confirmation", e.target.checked)} />
            <span className="t-body">Require two doctors to confirm incapacity before this POA activates</span>
          </label>
        </div>
      ),
    },
    {
      title: "Review", description: "Check your answers.", tip: "Click a step on the left to make changes.",
      render: ({ data }) => (
        <div className="stack g-2 t-body-sm">
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Name</span><span>{docStr(data, "full_legal_name") || "—"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Attorney</span><span>{`${docStr(data, "attorney_first_name")} ${docStr(data, "attorney_last_name")}`.trim() || "—"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Compensation</span><span>{docStr(data, "attorney_compensation")}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Applies</span><span>{docStr(data, "activation_condition")}</span></div>
        </div>
      ),
    },
  ],
};

export default function PoaPropertyPage() {
  return <DocWizard config={config} />;
}
