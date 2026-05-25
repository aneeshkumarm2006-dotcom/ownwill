import { CircleHelp, Mail } from "lucide-react";
import { Accordion, Button, Card } from "@/components/ui-kit";

const FAQ = [
  { q: "Is my will legally valid?", a: "Yes — for residents of all 10 Canadian provinces, when signed and witnessed according to your province's rules. We send you those exact rules with your will." },
  { q: "Can I update my will after I buy it?", a: "Absolutely — that's the point. Every plan includes free updates for life. Edit, regenerate, and reprint." },
  { q: "Do I need a lawyer?", a: "Most people don't. If your situation is complex (blended families, business assets, beneficiaries with disabilities), we recommend talking to an estate lawyer." },
  { q: "How does the money-back guarantee work?", a: "If you're not happy with your will within 30 days of purchase, email us and we'll refund — no questions asked." },
  { q: "Is my data secure?", a: "Yes. Your data is encrypted in transit and at rest. You can export or delete it any time from Profile." },
  { q: "What happens to my will if OwnWill goes away?", a: "You can download a copy of your will at any time and we'll send all customers a final export if we ever wind down." },
];

export default function SupportPage() {
  return (
    <section className="py-20">
      <div className="container max-marketing" style={{ maxWidth: 800, margin: "0 auto" }}>
        <span className="t-overline muted">Support</span>
        <h1 className="t-h1 mt-2">We&apos;re here when you need us.</h1>
        <div className="grid mt-8 g-4 support-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card className="stack g-3">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--teal-100)", color: "var(--teal-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CircleHelp /></div>
            <div className="t-h5">Chat with us</div>
            <div className="t-body-sm muted">Real humans, 9am–7pm ET, Monday to Friday.</div>
            <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }}>Start chat</Button>
          </Card>
          <Card className="stack g-3">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--coral-100)", color: "var(--coral-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Mail /></div>
            <div className="t-h5">Email</div>
            <div className="t-body-sm muted">help@ownwill.ca — we reply within 1 business day.</div>
            <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }}>Send a note</Button>
          </Card>
        </div>
        <h2 className="t-h3 mt-12">Frequently asked</h2>
        <div className="mt-4">
          <Accordion items={FAQ} />
        </div>
      </div>
      <style>{`@media (max-width: 640px) { .support-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
