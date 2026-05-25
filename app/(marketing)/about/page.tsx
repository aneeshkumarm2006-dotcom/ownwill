import { Alert, Card } from "@/components/ui-kit";
import { FinalCta } from "@/components/marketing/final-cta";
import { FamilyHome } from "@/components/illustrations";

const VALUES = [
  { title: "Plain language always.", body: "If your will doesn't sound like you, it isn't really yours." },
  { title: "Cheap shouldn't mean shoddy.", body: "Every template is reviewed by a Canadian estate lawyer." },
  { title: "Warmth beats fear.", body: "This is an act of love, not a transaction." },
  { title: "You own your data, always.", body: "Encrypted, exportable, deletable in a single click." },
];

export default function AboutPage() {
  return (
    <>
      <section className="py-20">
        <div className="container max-marketing" style={{ maxWidth: 720, margin: "0 auto" }}>
          <span className="t-overline muted">About</span>
          <h1 className="t-h1 mt-2">We want every Canadian to have a will — including you.</h1>
          <p className="t-body-lg muted mt-4">
            Six in ten Canadians don&apos;t have a will. It&apos;s not laziness — it&apos;s that the existing options feel cold, expensive, or full of jargon. We started OwnWill to fix that.
          </p>
          <div className="mt-12" style={{ background: "var(--muted)", borderRadius: 14, padding: 32 }}>
            <FamilyHome />
          </div>
          <h2 className="t-h2 mt-12">What we believe</h2>
          <div className="grid mt-6 g-4 about-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {VALUES.map((v) => (
              <Card key={v.title} className="stack g-2">
                <div className="t-h5">{v.title}</div>
                <div className="t-body-sm muted">{v.body}</div>
              </Card>
            ))}
          </div>
          <Alert className="mt-12" variant="info" title="We are not a law firm.">
            OwnWill is a self-serve legal forms service. Our templates are reviewed by lawyers, but we can&apos;t give individual legal advice. If your situation is complex, please talk to an estate lawyer — we keep a directory we trust.
          </Alert>
        </div>
      </section>
      <FinalCta />
      <style>{`@media (max-width: 640px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
