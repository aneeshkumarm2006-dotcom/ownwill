import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";

function Col({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div className="stack g-2">
      <div className="t-overline muted" style={{ marginBottom: 4 }}>{title}</div>
      {items.map((it) => (
        <Link key={it.label} href={it.to} className="t-body-sm" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container max-marketing" style={{ padding: "64px 24px 32px" }}>
        <div className="footer-grid">
          <div className="stack g-3">
            <Wordmark />
            <p className="t-body-sm muted" style={{ maxWidth: 280 }}>
              A warm, plain-language way to make a will, power of attorney, and asset list. Built in Canada.
            </p>
            <div className="row g-2 mt-2">
              <a className="btn btn-outline btn-sm btn-icon" aria-label="Twitter" href="#"><Sparkles size={16} aria-hidden="true" focusable={false} /></a>
              <a className="btn btn-outline btn-sm btn-icon" aria-label="Email" href="#"><Mail size={16} aria-hidden="true" focusable={false} /></a>
            </div>
          </div>
          <Col title="Product" items={[
            { label: "How it works", to: "/how-it-works" },
            { label: "Pricing", to: "/pricing" },
            { label: "Gift a plan", to: "/gift" },
          ]} />
          <Col title="Learn" items={[
            { label: "Articles", to: "/learn" },
            { label: "Support & FAQ", to: "/support" },
          ]} />
          <Col title="Company" items={[{ label: "About", to: "/about" }]} />
          <Col title="Legal" items={[
            { label: "Privacy", to: "/privacy" },
            { label: "Terms", to: "/terms" },
            { label: "Disclaimer", to: "/legal-disclaimer" },
          ]} />
        </div>
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)" }} className="row footer-bottom">
          <div className="t-caption muted" style={{ flex: 1 }}>
            © 2026 OwnWill, Inc. · Available in all 10 provinces · Made with care in Canada
          </div>
          <div className="t-caption muted" style={{ maxWidth: 460, textAlign: "right" }}>
            OwnWill is not a law firm and does not provide legal advice. We provide self-serve legal forms and information.
          </div>
        </div>
      </div>
      <style>{`
        .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; gap: 32px; }
        @media (max-width: 820px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .footer-bottom { flex-direction: column; gap: 12px; align-items: flex-start !important; text-align: left !important; }
          .footer-bottom > div { text-align: left !important; }
        }
      `}</style>
    </footer>
  );
}
