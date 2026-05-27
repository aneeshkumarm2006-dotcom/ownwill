"use client";

import { useWillStore } from "@/store/will";
import { PROVINCE_NAMES, type Province } from "@/types";
import {
  beneficiaryTotal,
  hasPerson,
  isMinor,
  personName,
  type Person,
} from "@/types/will";

function Section({
  title,
  editStep,
  children,
}: {
  title: string;
  editStep?: number;
  children: React.ReactNode;
}) {
  const setStep = useWillStore((s) => s.setStep);
  return (
    <section className="space-y-1 border-b py-3 last:border-b-0">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 className="text-sm font-semibold">{title}</h3>
        {editStep !== undefined ? (
          <button
            type="button"
            onClick={() => setStep(editStep)}
            className="t-caption focusable"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            Edit
          </button>
        ) : null}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function provinceName(p: Province | "") {
  return p ? PROVINCE_NAMES[p] : "—";
}

function personLine(p: Person) {
  if (!hasPerson(p)) return "Not provided";
  const parts = [personName(p)];
  if (p.relationship) parts.push(`(${p.relationship})`);
  return parts.join(" ");
}

export function ReviewStep() {
  const data = useWillStore((s) => s.data);

  return (
    <div className="space-y-1">
      <p className="pb-2 text-sm text-muted-foreground">
        Review your answers below. You can go back to make changes.
      </p>

      <Section title="Personal" editStep={1}>
        {data.full_legal_name || "—"}
        {" · "}
        {data.city ? `${data.city}, ` : ""}
        {provinceName(data.province)}
      </Section>

      <Section title="Executor" editStep={2}>
        <div>{personLine(data.executor)}</div>
        {hasPerson(data.backup_executor) ? (
          <div className="mt-1">Backup: {personLine(data.backup_executor)}</div>
        ) : null}
      </Section>

      <Section title="Beneficiaries" editStep={3}>
        {data.beneficiaries.length === 0
          ? "None"
          : data.beneficiaries.map((b) => (
              <div key={b._id}>
                {b.name || "Unnamed"} — {b.percentage}%
                {b.relationship ? ` (${b.relationship})` : ""}
              </div>
            ))}
        {data.beneficiaries.length > 0 ? (
          <div className="mt-1">Total: {beneficiaryTotal(data.beneficiaries)}%</div>
        ) : null}
      </Section>

      <Section title="Children" editStep={4}>
        {data.children.length === 0
          ? "None"
          : data.children.map((c) => (
              <div key={c._id}>
                {c.name || "Unnamed"}
                {c.dob && isMinor(c.dob) ? " (minor)" : ""}
              </div>
            ))}
        {hasPerson(data.guardian) ? (
          <div className="mt-1">Guardian: {personLine(data.guardian)}</div>
        ) : null}
      </Section>

      <Section title="Pets" editStep={5}>
        {data.pets.length === 0
          ? "None"
          : data.pets.map((p) => (
              <div key={p._id}>
                {p.name || "Unnamed"}
                {p.type ? ` — ${p.type}` : ""}
              </div>
            ))}
        {hasPerson(data.pet_guardian) ? (
          <div className="mt-1">
            Pet guardian: {personLine(data.pet_guardian)}
            {data.pet_care_fund ? ` · $${data.pet_care_fund} fund` : ""}
          </div>
        ) : null}
      </Section>

      <Section title="Specific gifts" editStep={6}>
        {data.specific_gifts.length === 0
          ? "None"
          : data.specific_gifts.map((g) => (
              <div key={g._id}>
                {g.item || "Item"} → {g.recipient_name || "recipient"}
              </div>
            ))}
      </Section>

      <Section title="Charitable donations" editStep={7}>
        {data.charitable_donations.length === 0
          ? "None"
          : data.charitable_donations.map((d) => (
              <div key={d._id}>
                {d.organization || "Organization"} —{" "}
                {d.is_percentage ? `${d.amount}%` : `$${d.amount}`}
              </div>
            ))}
      </Section>

      <Section title="Wishes" editStep={8}>
        {data.funeral_wishes || data.business_interests
          ? "Provided"
          : "None added"}
      </Section>

      <p className="pt-4 text-xs text-muted-foreground">
        Note: this will is not legally valid until printed and signed in front of
        two adult witnesses (electronic signing is available in BC only).
      </p>
    </div>
  );
}
