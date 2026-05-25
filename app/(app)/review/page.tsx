"use client";

import { ArrowLeft, ArrowRight, Edit, Info } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { useShell } from "@/components/app/shell-context";
import { Alert, Badge, Button, Card } from "@/components/ui-kit";
import { useWillLoader } from "@/hooks/use-will";
import { useWillStore } from "@/store/will";
import { beneficiaryTotal, hasPerson, isMinor, personName } from "@/types/will";

const PLAN_PRICE: Record<string, number> = { none: 199, essentials: 129, premium: 199, premium_x2: 299 };
const PLAN_LABEL: Record<string, string> = { none: "Premium", essentials: "Essentials", premium: "Premium", premium_x2: "Premium ×2" };

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div className="t-caption muted">{label}</div>
        <div className="t-body" style={{ marginTop: 2 }}>{value || <span className="muted">—</span>}</div>
      </div>
      <Button variant="link" href="/will" icon={<Edit size={14} />}>Edit</Button>
    </div>
  );
}

export default function ReviewPage() {
  const { loaded, error } = useWillLoader();
  const d = useWillStore((s) => s.data);
  const { user } = useShell();
  const price = PLAN_PRICE[user.plan];
  const label = PLAN_LABEL[user.plan];

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-overline muted">Order</div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="t-body">{label} plan</span>
          <span className="t-body" style={{ fontWeight: 600 }}>${price}</span>
        </div>
        <hr className="hr" />
        <div className="row" style={{ justifyContent: "space-between", fontWeight: 600 }}>
          <span>Total</span>
          <span>${price}.00 CAD</span>
        </div>
        <Button href="/payment" iconRight={<ArrowRight size={16} />}>Continue to payment</Button>
        <div className="t-caption muted" style={{ textAlign: "center" }}>30-day money-back guarantee</div>
      </Card>
      <Card className="stack g-3" style={{ background: "var(--teal-100)", borderColor: "var(--teal-200)" }}>
        <div className="row g-2"><Info size={18} style={{ color: "var(--teal-800)" }} /><div className="t-h5" style={{ margin: 0 }}>What&apos;s next</div></div>
        <div className="t-body-sm" style={{ color: "var(--teal-900)" }}>After payment we generate a print-ready PDF and email you province-specific signing instructions.</div>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb="Last Will & Testament" title="Review your will" actions={<Button variant="outline" size="sm" href="/will" icon={<ArrowLeft size={14} />}>Back to wizard</Button>} rail={rail} narrow>
      <p className="t-body muted mb-6" style={{ maxWidth: "62ch" }}>
        Read through. Anything off? Click &ldquo;Edit&rdquo; on the line. When it looks right, continue to payment.
      </p>

      {error ? (
        <Alert variant="error" title="Couldn't load your will">{error}</Alert>
      ) : !loaded ? (
        <Card><div className="skeleton" style={{ height: 200 }} /></Card>
      ) : (
        <>
          <Card className="stack g-2">
            <div className="t-h4 mb-2">About you</div>
            <Row label="Full legal name" value={d.full_legal_name} />
            <Row label="Date of birth" value={d.date_of_birth} />
            <Row label="Marital status" value={d.marital_status} />
          </Card>

          <Card className="stack g-2 mt-4">
            <div className="t-h4 mb-2">Executors</div>
            <Row label="Primary executor" value={hasPerson(d.executor) ? personName(d.executor) : ""} />
            <Row label="Backup executor" value={hasPerson(d.backup_executor) ? personName(d.backup_executor) : ""} />
          </Card>

          <Card className="stack g-2 mt-4">
            <div className="t-h4 mb-2">Beneficiaries</div>
            {d.beneficiaries.length === 0 ? (
              <Row label="Beneficiaries" value="None added" />
            ) : (
              d.beneficiaries.map((b, i) => (
                <Row key={i} label={`Share ${i + 1}`} value={`${b.name || "—"} · ${b.relationship || "—"} · ${b.percentage}%`} />
              ))
            )}
            {d.beneficiaries.length > 0 && (
              <div className="row mt-3" style={{ justifyContent: "space-between" }}>
                <span className="t-body-sm muted">Total</span>
                <Badge variant={beneficiaryTotal(d.beneficiaries) === 100 ? "completed" : "draft"}>{beneficiaryTotal(d.beneficiaries)}%</Badge>
              </div>
            )}
          </Card>

          <Card className="stack g-2 mt-4">
            <div className="t-h4 mb-2">Children</div>
            {d.children.length === 0 ? (
              <Row label="Children" value="None" />
            ) : (
              d.children.map((c, i) => (
                <Row key={i} label={`Child ${i + 1}`} value={`${c.name || "—"}${c.dob ? ` · born ${c.dob}` : ""}${c.dob && isMinor(c.dob) ? " · under 18" : ""}`} />
              ))
            )}
            {hasPerson(d.guardian) && <Row label="Guardian" value={personName(d.guardian)} />}
          </Card>

          {d.specific_gifts.length > 0 && (
            <Card className="stack g-2 mt-4">
              <div className="t-h4 mb-2">Specific gifts</div>
              {d.specific_gifts.map((g, i) => (
                <Row key={i} label={`Gift ${i + 1}`} value={`${g.item || "—"} → ${g.recipient_name || "—"}`} />
              ))}
            </Card>
          )}

          <Card className="stack g-2 mt-4">
            <div className="t-h4 mb-2">Final wishes</div>
            <Row label="Funeral / memorial" value={d.funeral_wishes} />
            <Row label="Business interests" value={d.business_interests} />
          </Card>

          <Alert variant="info" title="A note on signing" className="mt-6">
            Once you pay, we generate a print-ready PDF and email you province-specific signing instructions. In British Columbia, you may sign electronically. Everywhere else, you&apos;ll print and sign in front of two adult witnesses.
          </Alert>
        </>
      )}
    </AppPage>
  );
}
