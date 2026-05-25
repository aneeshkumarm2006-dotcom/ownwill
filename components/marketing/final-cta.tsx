import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { LeafMark } from "@/components/brand/logo";

export function FinalCta() {
  return (
    <section className="reverse" style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
      <div className="container max-marketing row final-cta-row" style={{ gap: 32, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth: 560 }}>
          <span className="t-overline" style={{ color: "var(--coral-300)" }}>Ready when you are</span>
          <h2 className="t-h2 mt-2" style={{ color: "#F0FAF9", textWrap: "balance" }}>
            Today is a fine day to take care of your people.
          </h2>
          <p className="t-body mt-3 muted" style={{ maxWidth: 480 }}>
            Start free. You only pay when you&apos;re ready to download.
          </p>
        </div>
        <div className="row g-3" style={{ flexWrap: "wrap" }}>
          <Button size="lg" variant="cta" href="/signup" iconRight={<ArrowRight size={18} />}>
            Start my will
          </Button>
          <Button size="lg" variant="outline" href="/pricing" style={{ borderColor: "rgba(255,255,255,.3)", color: "#F0FAF9" }}>
            See pricing
          </Button>
        </div>
      </div>
      <div style={{ position: "absolute", right: -40, bottom: -40, opacity: 0.12 }}>
        <LeafMark size={240} color="#F0FAF9" accent="var(--coral-500)" />
      </div>
      <style>{`@media (max-width: 820px) { .final-cta-row { flex-direction: column; align-items: flex-start; } }`}</style>
    </section>
  );
}

export function FaqTop() {
  const items = [
    { q: "Is an OwnWill will legally valid?", a: "Yes — for residents of all 10 Canadian provinces. We honour your province's signing rules (witnesses, BC e-signing) and recommend you follow them carefully." },
    { q: "How long does this actually take?", a: "Most people finish in about 20 minutes. We save your progress automatically, so you can pause and come back." },
    { q: "What if my life changes later?", a: "Updates are free for life. Re-run any step, re-generate the document, and you're set." },
    { q: "Is OwnWill a law firm?", a: "No — we're a self-serve legal forms service. We make plain-language templates that estate lawyers have reviewed, but we don't give individual legal advice." },
    { q: "What if I'm not sure what to choose?", a: "Every question has a friendly explainer. Hover over the underlined terms to see plain-language definitions." },
  ];
  return items;
}
