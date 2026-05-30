import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Lock,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui-kit";

export const metadata = {
  title: "OwnWill for Pros — Run estate planning for your clients",
  description:
    "OwnWill Pro gives law firms, financial advisors, funeral homes, and HR teams a self-serve wills portal for their clients. Per-seat pricing in CAD.",
};

function Hero() {
  return (
    <section className="hero-tint" style={{ padding: "80px 0 56px" }}>
      <div
        className="container max-marketing hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div className="rise">
          <Badge variant="new">For law firms · advisors · funeral homes · employers</Badge>
          <h1 className="t-display mt-4" style={{ margin: "12px 0", textWrap: "balance" }}>
            Add a wills service to your practice <span style={{ color: "var(--coral-500)" }}>without the overhead</span>.
          </h1>
          <p className="t-body-lg muted" style={{ maxWidth: 540, marginTop: 16 }}>
            OwnWill Pro is a white-labelled portal for firms that want to offer simple,
            plain-language Canadian wills to their clients. Paralegal-led. Province-aware.
            You stay in control of the relationship.
          </p>
          <div className="mt-6 row g-3" style={{ flexWrap: "wrap" }}>
            <Button size="lg" href="/pro/signup" iconRight={<ArrowRight size={18} />}>
              Start your firm — $79/seat
            </Button>
            <Button size="lg" variant="outline" href="mailto:sales@ownwill.ca?subject=OwnWill%20Pro%20demo">
              Book a demo
            </Button>
          </div>
          <div className="row g-4 mt-6" style={{ flexWrap: "wrap" }}>
            <div className="row g-2 t-body-sm muted">
              <CheckCircle2 size={16} /> CAD billing, monthly
            </div>
            <div className="row g-2 t-body-sm muted">
              <Lock size={16} /> PIPEDA-aware audit trail
            </div>
            <div className="row g-2 t-body-sm muted">
              <BadgeCheck size={16} /> Lawyer-reviewed templates
            </div>
          </div>
        </div>
        <div className="hero-split-illo">
          <Card padded className="stack g-3" style={{ minHeight: 280 }}>
            <div className="row g-2">
              <Badge variant="completed">Live</Badge>
              <span className="t-caption muted">Acme Legal · 8 active clients</span>
            </div>
            <h3 className="t-h4" style={{ margin: 0 }}>This week</h3>
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li className="row g-2"><Users size={16} /> 3 new clients invited</li>
              <li className="row g-2"><FileText size={16} /> 2 wills generated</li>
              <li className="row g-2"><ScrollText size={16} /> 14 audit events</li>
            </ul>
          </Card>
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; } .hero-split-illo { max-width: 480px; margin: 0 auto; } }`}</style>
    </section>
  );
}

function ValueProps() {
  const items = [
    {
      icon: <Users />,
      title: "Invite clients, not paperwork",
      body: "Send an email link. The client signs up, completes their will in their own time, and you see their progress.",
    },
    {
      icon: <ScrollText />,
      title: "Audit-grade trail",
      body: "Every staff action against a client file is logged. Show clients exactly who touched their documents and when.",
    },
    {
      icon: <Lock />,
      title: "Client-revokable access",
      body: "Clients can remove your firm's access at any time. PIPEDA-friendly by design; trust by default.",
    },
    {
      icon: <Sparkles />,
      title: "Your brand on the email",
      body: "Logo on invite emails at launch. Vanity subdomain and brand color follow on later phases.",
    },
  ];
  return (
    <section style={{ padding: "72px 0" }}>
      <div className="container max-marketing">
        <h2 className="t-h2" style={{ textAlign: "center", marginBottom: 12 }}>
          What you get on day one
        </h2>
        <p className="t-body muted" style={{ textAlign: "center", maxWidth: 580, margin: "0 auto 40px" }}>
          A clean staff portal, a respectful client experience, and the legal substrate you'd want
          a Canadian wills tool to have.
        </p>
        <div className="grid g-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {items.map((it) => (
            <Card key={it.title} className="stack g-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--teal-100)",
                  color: "var(--teal-800)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {it.icon}
              </div>
              <h3 className="t-h5" style={{ margin: 0 }}>{it.title}</h3>
              <p className="t-body-sm muted" style={{ margin: 0 }}>{it.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      id: "starter",
      name: "Starter",
      seats: "1–3 seats",
      price: 79,
      blurb: "For paralegal-led practices testing the waters.",
      features: [
        "Unlimited client invitations",
        "Logo on client-facing emails",
        "Org-scoped audit log",
        "Email support",
      ],
    },
    {
      id: "team",
      name: "Team",
      seats: "4–10 seats",
      price: 69,
      popular: true,
      blurb: "Full practice with multiple paralegals or advisors.",
      features: [
        "Everything in Starter",
        "Bulk client CSV upload",
        "Role-based permissions",
        "Priority support",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      seats: "11+ seats",
      price: null,
      blurb: "Custom pricing, SSO, webhooks, and onboarding support.",
      features: [
        "Everything in Team",
        "SSO (Entra / Google)",
        "Outbound webhooks + REST API",
        "Dedicated onboarding",
      ],
    },
  ];

  return (
    <section style={{ padding: "72px 0", background: "var(--muted)" }}>
      <div className="container max-marketing">
        <h2 className="t-h2" style={{ textAlign: "center", marginBottom: 8 }}>
          Per-seat pricing. CAD, monthly.
        </h2>
        <p className="t-body muted" style={{ textAlign: "center", marginBottom: 40 }}>
          Annual billing (~17% off) lands in a later phase. Cancel anytime; clients keep their docs.
        </p>
        <div className="grid g-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", alignItems: "stretch" }}>
          {tiers.map((t) => (
            <Card key={t.id} className="stack g-4">
              {t.popular && <Badge variant="new" style={{ alignSelf: "flex-start" }}>Most chosen</Badge>}
              <div>
                <div className="t-h4">{t.name}</div>
                <div className="t-body-sm muted">{t.seats}</div>
              </div>
              <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
                {t.price === null ? (
                  <span className="t-h3">Custom</span>
                ) : (
                  <>
                    <span className="t-h2">${t.price}</span>
                    <span className="t-body-sm muted">/seat/month CAD</span>
                  </>
                )}
              </div>
              <p className="t-body-sm muted" style={{ margin: 0 }}>{t.blurb}</p>
              <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                {t.features.map((f) => (
                  <li key={f} className="row g-2 t-body-sm">
                    <CheckCircle2 size={16} style={{ color: "var(--primary)", flex: "none" }} />
                    {f}
                  </li>
                ))}
              </ul>
              {t.id === "enterprise" ? (
                <Button variant="outline" href="mailto:sales@ownwill.ca?subject=OwnWill%20Pro%20enterprise">
                  Talk to sales
                </Button>
              ) : (
                <Button variant={t.popular ? "primary" : "outline"} href="/pro/signup">
                  Start with {t.name}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFooter() {
  return (
    <section style={{ padding: "72px 0" }}>
      <div className="container max-marketing" style={{ textAlign: "center" }}>
        <h2 className="t-h2" style={{ margin: 0, textWrap: "balance" }}>
          Set up your firm in under five minutes.
        </h2>
        <p className="t-body muted" style={{ maxWidth: 540, margin: "12px auto 28px" }}>
          Create the org, invite your first teammate, and send your first client invite the
          same afternoon. No procurement, no contracts.
        </p>
        <div className="row g-3" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" href="/pro/signup" iconRight={<ArrowRight size={18} />}>
            Create your org
          </Button>
          <Button size="lg" variant="outline" href="mailto:sales@ownwill.ca?subject=OwnWill%20Pro%20demo">
            Book a demo
          </Button>
        </div>
        <p className="t-caption muted" style={{ marginTop: 20 }}>
          OwnWill is software, not a law firm, and does not provide legal advice or form a
          solicitor-client relationship — even when a law firm uses it. Any lawyer-client
          privilege between a firm and its clients is governed by that firm&rsquo;s own
          retainer and conduct, not by this platform.
        </p>
      </div>
    </section>
  );
}

export default function ProMarketingPage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <Pricing />
      <CtaFooter />
    </>
  );
}
