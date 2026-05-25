import { Check } from "lucide-react";
import { Alert, Card } from "@/components/ui-kit";
import { FinalCta } from "@/components/marketing/final-cta";
import { ChecklistFlow, QuillSign, ShieldHands } from "@/components/illustrations";

const STEPS = [
  { n: 1, title: "Answer plain-language questions", body: "We walk you through everything we need — family, executors, gifts, wishes — in the order it makes sense. Each question has a quiet explainer if you want it.", illo: <ChecklistFlow active={1} /> },
  { n: 2, title: "Review your will in plain English", body: "See what your answers become — side-by-side with the legal text. Edit anything by clicking it. Nothing is set in stone.", illo: <QuillSign /> },
  { n: 3, title: "Print, sign, and you're done", body: "Province-specific instructions ship with your will. Two witnesses, no notary needed (with one exception). In BC, you can sign electronically.", illo: <ShieldHands /> },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="hero-tint" style={{ padding: "64px 0 32px" }}>
        <div className="container max-marketing" style={{ textAlign: "center" }}>
          <span className="t-overline muted">How it works</span>
          <h1 className="t-h1 mt-2">A calm afternoon, three plain steps.</h1>
          <p className="t-body-lg muted mt-3" style={{ maxWidth: 600, margin: "12px auto 0" }}>
            Answer questions, review your document, print and sign. We&apos;ll be with you the whole way.
          </p>
        </div>
      </section>

      {STEPS.map((s, i) => (
        <section key={i} className="py-20" style={{ background: i % 2 ? "var(--card)" : "transparent" }}>
          <div className="container max-marketing hiw-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div style={{ order: i % 2 ? 2 : 1 }}>
              <div className="t-overline muted">Step {s.n}</div>
              <h2 className="t-h2 mt-2" style={{ textWrap: "balance" }}>{s.title}</h2>
              <p className="t-body-lg muted mt-3" style={{ maxWidth: 480 }}>{s.body}</p>
            </div>
            <div style={{ order: i % 2 ? 1 : 2, background: "var(--muted)", borderRadius: 14, padding: 24, minHeight: 240 }}>{s.illo}</div>
          </div>
        </section>
      ))}

      <section className="py-20">
        <div className="container max-marketing">
          <Card padded className="hiw-need" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
            <div>
              <h3 className="t-h3">What you&apos;ll need</h3>
              <ul className="stack g-2 mt-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "Your legal name and date of birth",
                  "Names of any partners, kids, executors, witnesses",
                  "A rough idea of who gets what",
                  "A printer and two adult witnesses (not in BC)",
                ].map((t) => (
                  <li key={t} className="row g-2 t-body"><Check style={{ color: "var(--primary)" }} size={18} /> {t}</li>
                ))}
              </ul>
            </div>
            <Alert variant="info" title="A note on legal validity">
              OwnWill is not a law firm. The will we create follows the rules of your province, but you must sign and witness it properly for it to be valid. We tell you exactly how.
            </Alert>
          </Card>
        </div>
      </section>

      <FinalCta />
      <style>{`@media (max-width: 820px) { .hiw-row, .hiw-need { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
