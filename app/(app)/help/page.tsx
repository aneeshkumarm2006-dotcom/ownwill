"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, FileText, CircleHelp, Mail, Printer, Search, Shield, Sparkles } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { useShell } from "@/components/app/shell-context";
import { Accordion, Alert, Button, Card, Field, Input, Textarea } from "@/components/ui-kit";

const TOPICS = [
  { q: "How do I update my will after I've paid?", a: "Open Dashboard → My Will → Continue. Make your changes and regenerate. Updates are free for life." },
  { q: "I need to change my province — what happens to my will?", a: "Go to Profile and update your province. We'll re-run your will against your new province's rules and flag anything that needs your attention." },
  { q: "How do I download my signed will again?", a: "Open Dashboard → My Will → Download. You can re-download anytime." },
  { q: "Can my partner share my account?", a: "Premium ×2 plans link two accounts together. If you're on a single Premium plan, you can gift them their own account from the Gift a plan page." },
  { q: "How do I cancel and get a refund?", a: "Within 30 days of purchase, email help@ownwill.ca with your account email. We refund — no questions asked." },
  { q: "Where are my documents stored?", a: "All your data is encrypted at rest and in transit on Canadian servers. You can export or permanently delete everything from Profile → Your data." },
];

export default function HelpPage() {
  const { user } = useShell();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const filtered = search ? TOPICS.filter((t) => (t.q + t.a).toLowerCase().includes(search.toLowerCase())) : TOPICS;
  const firstName = (user.fullName || "there").split(/\s+/)[0];

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubject("");
    setMessage("");
    toast.success("Message sent — we'll reply within one business day.");
  }

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="row g-2"><Mail size={18} style={{ color: "var(--primary)" }} /><div className="t-h5" style={{ margin: 0 }}>Your case email</div></div>
        <div className="t-body-sm muted">Replies land in your inbox. Account context is attached automatically.</div>
        <div className="t-body-sm" style={{ fontWeight: 600, padding: "8px 12px", background: "var(--muted)", borderRadius: 8, wordBreak: "break-all" }}>{user.email}</div>
      </Card>
      <Card className="stack g-3">
        <div className="t-h5">Live chat</div>
        <div className="t-body-sm muted">9am–7pm ET, Monday to Friday.</div>
        <Button variant="outline" size="sm" icon={<Sparkles size={14} />} style={{ alignSelf: "flex-start" }}>Start a chat</Button>
      </Card>
      <Card className="stack g-3" style={{ background: "var(--teal-100)", borderColor: "var(--teal-200)" }}>
        <div className="row g-2"><Shield size={18} style={{ color: "var(--teal-800)" }} /><div className="t-h5" style={{ margin: 0 }}>Need legal advice?</div></div>
        <div className="t-body-sm" style={{ color: "var(--teal-900)" }}>If your situation is complex, our partner lawyer directory has vetted Canadian estate lawyers.</div>
        <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }}>Find a lawyer</Button>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb="Account" title="Help & support" actions={<Button variant="outline" size="sm" href="/support" icon={<CircleHelp size={14} />}>Public FAQ</Button>} rail={rail} narrow>
      <p className="t-body muted mb-6" style={{ maxWidth: "62ch" }}>
        Hi {firstName} — we&apos;re here to help. Search your questions below, or send us a note.
      </p>

      <div className="mt-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your questions…" leadingIcon={<Search size={16} />} />
      </div>

      <Card className="stack g-2 mt-4">
        <div className="t-h4 mb-2">For your account</div>
        {filtered.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: "16px 0" }}>No matches. Try a different word, or send us a note below.</div>
        ) : (
          <Accordion items={filtered} />
        )}
      </Card>

      <div className="mt-6 grid g-3 help-quick" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Link href="/signing" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive className="row g-3" style={{ alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--coral-100)", color: "var(--coral-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Printer size={18} /></div>
            <div style={{ flex: 1 }}><div className="t-body" style={{ fontWeight: 600 }}>Signing help</div><div className="t-caption muted">Province-specific steps</div></div>
          </Card>
        </Link>
        <Link href="/billing" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive className="row g-3" style={{ alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--teal-100)", color: "var(--teal-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CreditCard size={18} /></div>
            <div style={{ flex: 1 }}><div className="t-body" style={{ fontWeight: 600 }}>Billing &amp; receipts</div><div className="t-caption muted">Plan, invoices, refunds</div></div>
          </Card>
        </Link>
        <Link href="/learn" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive className="row g-3" style={{ alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--sand-100)", color: "var(--ink-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><FileText size={18} /></div>
            <div style={{ flex: 1 }}><div className="t-body" style={{ fontWeight: 600 }}>Learn articles</div><div className="t-caption muted">Wills, executors, more</div></div>
          </Card>
        </Link>
      </div>

      <Card className="stack g-4 mt-6">
        <div>
          <div className="t-h4">Send us a note</div>
          <div className="t-body-sm muted mt-1">We reply within one business day. Your name, email, and current plan come along automatically.</div>
        </div>
        <form onSubmit={sendMessage} className="stack g-4">
          <Field label="Subject" required>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. I'd like to update my executor" />
          </Field>
          <Field label="Message" required>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Tell us what's going on. The more detail, the better we can help." />
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button type="submit" icon={<Mail size={16} />}>Send message</Button>
          </div>
        </form>
      </Card>
      <Alert variant="info" className="mt-6">Replies go to {user.email}.</Alert>
      <style>{`@media (max-width: 760px) { .help-quick { grid-template-columns: 1fr !important; } }`}</style>
    </AppPage>
  );
}
