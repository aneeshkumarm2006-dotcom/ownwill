"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { MailboxIllo } from "@/components/illustrations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell illustration={<MailboxIllo />}>
      <AuthHeader title="Forgot your password?" subtitle="No worries — we'll email you a reset link." />
      {!sent ? (
        <form className="stack g-4" onSubmit={handleSubmit}>
          <Field label="Email">
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Mail size={16} />} />
          </Field>
          <Button type="submit" size="lg" className="btn-block" loading={loading}>Send reset link</Button>
          <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
            <Button variant="link" href="/login">Back to log in</Button>
          </div>
        </form>
      ) : (
        <div className="stack g-4" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 200, margin: "0 auto" }}><MailboxIllo /></div>
          <h2 className="t-h3">Check your inbox</h2>
          <p className="t-body muted">If an account exists for <strong>{email}</strong>, you&apos;ll get a reset link shortly.</p>
          <Button variant="link" href="/login">Back to log in</Button>
        </div>
      )}
    </AuthShell>
  );
}
