"use client";

import { DocWizard, type DocWizardConfig } from "@/components/docs/doc-wizard";
import { FlatPerson, docStr } from "@/components/docs/fields";
import { Field, Input, Textarea } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { PROVINCE_OPTIONS } from "@/types";

const LIFE_SUPPORT = [
  { value: "maintain", label: "Maintain life support" },
  { value: "remove", label: "Remove life support if no reasonable recovery" },
  { value: "attorney_decides", label: "Let my attorney decide" },
];
const YESNO = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes — I wish to donate" },
];
const ACTIVATION = [
  { value: "incapacity_only", label: "Only if I become mentally incapable" },
  { value: "immediately", label: "Immediately upon signing" },
];

const config: DocWizardConfig = {
  type: "poa_health",
  table: "poa_health_data",
  title: "Power of Attorney — Health",
  breadcrumb: "My documents",
  finishHref: "/documents/poa_health",
  defaults: {
    full_legal_name: "", date_of_birth: "", province: "",
    life_support_wishes: "", organ_donation: false, organ_donation_specifics: "",
    additional_health_wishes: "", activation_condition: "incapacity_only",
  },
  validate: (step, data) => {
    if (step === 1 && !String(data.full_legal_name || "").trim()) return "Please enter your full legal name.";
    if (step === 2 && !docStr(data, "attorney_first_name").trim()) return "Please name your health attorney.";
    return null;
  },
  steps: [
    {
      title: "About you", description: "Your details.", tip: "This POA names who makes medical decisions if you can't.",
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
      title: "Your attorney", description: "Who makes medical decisions for you.", tip: "Pick someone who knows your values and can stay calm under pressure.",
      render: ({ data, set }) => (
        <div className="stack g-6">
          <section className="stack g-3"><h3 className="t-h5" style={{ margin: 0 }}>Attorney</h3><FlatPerson data={data} set={set} prefix="attorney" /></section>
          <section className="stack g-3"><h3 className="t-h5" style={{ margin: 0 }}>Backup attorney</h3><FlatPerson data={data} set={set} prefix="backup_attorney" /></section>
        </div>
      ),
    },
    {
      title: "Care wishes", description: "Your preferences for care.", tip: "These guide your attorney — they're not set in stone.",
      render: ({ data, set }) => (
        <div className="stack g-4">
          <Field label="Life support wishes"><Dropdown value={docStr(data, "life_support_wishes")} onChange={(v) => set("life_support_wishes", v)} options={LIFE_SUPPORT} placeholder="Select…" /></Field>
          <Field label="Organ donation"><Dropdown value={data.organ_donation ? "yes" : "no"} onChange={(v) => set("organ_donation", v === "yes")} options={YESNO} /></Field>
          {Boolean(data.organ_donation) && (
            <Field label="Organ donation specifics (optional)"><Input value={docStr(data, "organ_donation_specifics")} onChange={(e) => set("organ_donation_specifics", e.target.value)} placeholder="e.g. for transplant only" /></Field>
          )}
          <Field label="Additional health wishes (optional)"><Textarea value={docStr(data, "additional_health_wishes")} onChange={(e) => set("additional_health_wishes", e.target.value)} rows={4} /></Field>
        </div>
      ),
    },
    {
      title: "When it applies", description: "Activation condition.", tip: "Most people choose 'only if I become incapable'.",
      render: ({ data, set }) => (
        <Field label="This POA takes effect"><Dropdown value={docStr(data, "activation_condition")} onChange={(v) => set("activation_condition", v)} options={ACTIVATION} /></Field>
      ),
    },
    {
      title: "Review", description: "Check your answers.", tip: "Click a step on the left to make changes.",
      render: ({ data }) => (
        <div className="stack g-2 t-body-sm">
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Name</span><span>{docStr(data, "full_legal_name") || "—"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Attorney</span><span>{`${docStr(data, "attorney_first_name")} ${docStr(data, "attorney_last_name")}`.trim() || "—"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Life support</span><span>{docStr(data, "life_support_wishes") || "—"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Organ donation</span><span>{data.organ_donation ? "Yes" : "No"}</span></div>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Applies</span><span>{docStr(data, "activation_condition")}</span></div>
        </div>
      ),
    },
  ],
};

export default function PoaHealthPage() {
  return <DocWizard config={config} />;
}
