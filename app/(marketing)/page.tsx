import {
  ArrowRight,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Home,
  Shield,
  Sparkles,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Accordion, Badge, Button, Card } from "@/components/ui-kit";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FinalCta, FaqTop } from "@/components/marketing/final-cta";
import { PaperFold, ChecklistFlow, QuillSign, ShieldHands } from "@/components/illustrations";

function Hero() {
  return (
    <section className="hero-tint" style={{ padding: "80px 0 64px" }}>
      <div className="container max-marketing hero-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "center" }}>
        <div className="rise">
          <span className="t-overline" style={{ color: "var(--coral-700)" }}>Plain-language Canadian wills</span>
          <h1 className="t-display mt-4" style={{ margin: "12px 0", textWrap: "balance" }}>
            Make a will you&apos;ll actually <span style={{ color: "var(--coral-500)" }}>finish</span>.
          </h1>
          <p className="t-body-lg muted" style={{ maxWidth: 520, marginTop: 16 }}>
            A warm, step-by-step process that turns a heavy task into a calm afternoon. Done in about 20 minutes — kept up to date for life.
          </p>
          <div className="mt-6 row g-3" style={{ flexWrap: "wrap" }}>
            <Button size="lg" href="/signup" iconRight={<ArrowRight size={18} />}>Get started — $129</Button>
            <Button size="lg" variant="outline" href="/how-it-works">See how it works</Button>
          </div>
          <div className="row g-4 mt-6" style={{ flexWrap: "wrap" }}>
            <div className="row g-2 t-body-sm muted"><CheckCircle2 size={16} />30-day money-back guarantee</div>
            <div className="row g-2 t-body-sm muted"><Star size={16} />4.8 average from 12,400+ Canadians</div>
          </div>
        </div>
        <div className="hero-split-illo">
          <PaperFold />
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; } .hero-split-illo { max-width: 480px; margin: 0 auto; } }`}</style>
    </section>
  );
}

function ValueProps() {
  const props = [
    { icon: <Shield />, title: "Lawyer-approved", body: "Templates reviewed by Canadian estate lawyers in every province." },
    { icon: <Clock />, title: "About 20 minutes", body: "Plain-language questions in the order you'd actually answer them." },
    { icon: <Sparkles />, title: "Update free for life", body: "Life changes — your will should too. Edit and reprint anytime." },
    { icon: <Home />, title: "All 10 provinces", body: "Honours your province's signing rules, including BC e-signing." },
  ];
  return (
    <section className="py-20">
      <div className="container max-marketing">
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span className="t-overline muted">Why OwnWill</span>
          <h2 className="t-h2 mt-2" style={{ textWrap: "balance" }}>A real will, without the law-office stiffness.</h2>
        </div>
        <div className="grid value-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {props.map((p, i) => (
            <Card key={i} className="stack g-3 rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--teal-100)", color: "var(--teal-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{p.icon}</div>
              <div className="t-h5">{p.title}</div>
              <div className="t-body-sm muted">{p.body}</div>
            </Card>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .value-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 520px) { .value-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Answer plain-language questions", body: "We ask about you, your loved ones, and your wishes — in everyday words. Save and return anytime.", illo: <ChecklistFlow active={1} /> },
    { n: 2, title: "Review your document", body: "We translate your answers into a real, legally valid will. Read it side-by-side with what you told us.", illo: <QuillSign /> },
    { n: 3, title: "Print, sign, and you're done", body: "We send province-specific signing instructions. In BC, you can sign electronically.", illo: <ShieldHands /> },
  ];
  return (
    <section className="py-20" style={{ background: "var(--card)" }}>
      <div className="container max-marketing">
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span className="t-overline muted">How it works</span>
          <h2 className="t-h2 mt-2">Three calm steps, about twenty minutes.</h2>
        </div>
        <div className="grid hiw-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {steps.map((s, i) => (
            <div key={i} className="rise" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="row g-3 mb-4">
                <div style={{ width: 40, height: 40, borderRadius: 99, background: "var(--coral-100)", color: "var(--coral-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{s.n}</div>
                <div className="t-h4" style={{ margin: 0 }}>{s.title}</div>
              </div>
              <p className="t-body muted" style={{ maxWidth: "32ch" }}>{s.body}</p>
              <div style={{ height: 140, marginTop: 16, background: "var(--muted)", borderRadius: 14, overflow: "hidden", padding: 16 }}>{s.illo}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .hiw-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function DocTypes() {
  const docs = [
    { title: "Last Will & Testament", body: "Decide who inherits, who looks after your kids, and who runs the show.", tag: "Included in all plans", icon: <FileText size={36} /> },
    { title: "Power of Attorney — Property", body: "Choose who handles your money if you're ever unable to.", tag: "Premium", icon: <CreditCard size={36} /> },
    { title: "Power of Attorney — Health", body: "Spell out medical wishes and a trusted decision-maker.", tag: "Premium", icon: <Heart size={36} /> },
    { title: "Asset List", body: "A living document so your people know what you have, and where.", tag: "Premium", icon: <Shield size={36} /> },
  ];
  const bg = ["var(--teal-100)", "var(--coral-100)", "var(--sand-100)", "var(--teal-100)"];
  return (
    <section className="py-20">
      <div className="container max-marketing">
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span className="t-overline muted">Documents</span>
          <h2 className="t-h2 mt-2">The four documents most Canadian families need.</h2>
        </div>
        <div className="grid doc-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {docs.map((d, i) => (
            <Card key={i} className="stack g-3">
              <div style={{ height: 80, background: bg[i], borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal-800)" }}>{d.icon}</div>
              <div className="t-h5">{d.title}</div>
              <div className="t-body-sm muted" style={{ flex: 1 }}>{d.body}</div>
              <Badge variant={i === 0 ? "completed" : "new"}>{d.tag}</Badge>
            </Card>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 1024px) { .doc-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 520px) { .doc-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="py-20" style={{ background: "var(--card)" }}>
      <div className="container max-marketing">
        <div className="pricing-teaser-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 48, alignItems: "center" }}>
          <div>
            <span className="t-overline muted">Pricing</span>
            <h2 className="t-h2 mt-2">One-time payment. Free updates for life.</h2>
            <p className="t-body muted mt-3">No subscriptions, no surprises. Make changes whenever life does — for free.</p>
          </div>
          <PricingCards />
        </div>
        <style>{`@media (max-width: 1024px) { .pricing-teaser-grid { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "I started a will three different times and never finished. OwnWill walked me through it in an afternoon while my baby napped.", author: "Maya R.", role: "Mom of one, Toronto" },
    { quote: "The plain English actually let me understand what I was signing. My lawyer cousin even approved.", author: "Doug & Jen P.", role: "BC" },
    { quote: "I changed our beneficiaries after our second was born. Took five minutes. No new fees.", author: "Priya S.", role: "Calgary" },
  ];
  return (
    <section className="py-20">
      <div className="container max-marketing">
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span className="t-overline muted">Real Canadians</span>
          <h2 className="t-h2 mt-2">A weight off, in their own words.</h2>
        </div>
        <div className="grid testimonials-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((t, i) => (
            <Card key={i} className="stack g-4">
              <div className="row g-1" style={{ color: "var(--coral-500)" }}>
                {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={16} fill="var(--coral-500)" />)}
              </div>
              <p className="t-body" style={{ flex: 1, textWrap: "pretty" }}>&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>{t.author}</div>
                <div className="t-caption muted">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .testimonials-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function FaqSection() {
  return (
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
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <DocTypes />
      <PricingTeaser />
      <Testimonials />
      <FaqSection />
      <FinalCta />
    </>
  );
}
