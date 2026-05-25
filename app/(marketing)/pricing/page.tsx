import { Check, Shield } from "lucide-react";
import { Accordion, Button, Card } from "@/components/ui-kit";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FinalCta, FaqTop } from "@/components/marketing/final-cta";

const ROWS: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Last Will & Testament", true, true, "2 wills"],
  ["Power of Attorney — Property", false, true, "2 docs"],
  ["Power of Attorney — Health", false, true, "2 docs"],
  ["Asset List", false, true, "2 lists"],
  ["Province-specific signing instructions", true, true, true],
  ["Free updates for life", true, true, true],
  ["Priority support", false, false, true],
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check style={{ color: "var(--primary)" }} />;
  if (v === false) return <span className="muted">—</span>;
  return <>{v}</>;
}

export default function PricingPage() {
  return (
    <>
      <section className="hero-tint" style={{ padding: "64px 0 32px", textAlign: "center" }}>
        <div className="container max-marketing">
          <span className="t-overline muted">Pricing</span>
          <h1 className="t-h1 mt-2">Honest pricing. One payment. Updates for life.</h1>
          <p className="t-body-lg muted mt-3" style={{ maxWidth: 600, margin: "12px auto 0" }}>
            Pick the plan that fits — you can always upgrade later.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-marketing">
          <PricingCards />
        </div>
      </section>

      <section className="py-12">
        <div className="container max-marketing">
          <Card className="row" style={{ gap: 16, alignItems: "center", justifyContent: "space-between", padding: 24, flexWrap: "wrap" }}>
            <div className="row g-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--coral-100)", color: "var(--coral-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Shield />
              </div>
              <div>
                <div className="t-h5">30-day money-back guarantee</div>
                <div className="t-body-sm muted">If it&apos;s not right for you, we&apos;ll refund — no awkward questions.</div>
              </div>
            </div>
            <Button variant="outline" href="/support">Read the fine print</Button>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-marketing">
          <h2 className="t-h3 mb-6">Side-by-side</h2>
          <Card padded={false} style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 16, fontWeight: 600 }}>Feature</th>
                    <th className="t-body-sm" style={{ padding: 16, fontWeight: 600 }}>Essentials</th>
                    <th className="t-body-sm" style={{ padding: 16, fontWeight: 600 }}>Premium</th>
                    <th className="t-body-sm" style={{ padding: 16, fontWeight: 600 }}>Premium ×2</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="t-body-sm" style={{ padding: 16 }}>{row[0]}</td>
                      <td className="t-body-sm" style={{ padding: 16, textAlign: "center" }}><Cell v={row[1]} /></td>
                      <td className="t-body-sm" style={{ padding: 16, textAlign: "center" }}><Cell v={row[2]} /></td>
                      <td className="t-body-sm" style={{ padding: 16, textAlign: "center" }}><Cell v={row[3]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-20" style={{ background: "var(--card)" }}>
        <div className="container max-marketing">
          <div className="faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48 }}>
            <div>
              <span className="t-overline muted">Questions</span>
              <h2 className="t-h2 mt-2">Common things people ask.</h2>
            </div>
            <Accordion items={FaqTop()} />
          </div>
          <style>{`@media (max-width: 820px) { .faq-grid { grid-template-columns: 1fr !important; } }`}</style>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
