"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { MailboxIllo } from "@/components/illustrations";
import { passwordStrength, STRENGTH_LABELS } from "@/lib/password";
import { PROVINCE_OPTIONS, type Province } from "@/types";

const STRENGTH_COLOR = (s: number) =>
  s < 2 ? "var(--destructive)" : s < 3 ? "var(--warning)" : "var(--success)";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState<Province | "">("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Please enter your legal name.";
    if (!email.includes("@")) errs.email = "Please enter a valid email.";
    if (password.length < 8) errs.password = "Use at least 8 characters.";
    if (!province) errs.province = "Choose your province.";
    if (!agree) errs.agree = "Please agree to continue.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, province },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <AuthShell illustration={<MailboxIllo />}>
        <div className="stack g-4" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 200, margin: "0 auto" }}><MailboxIllo /></div>
          <h1 className="t-h2">Check your email</h1>
          <p className="t-body muted">
            We sent a confirmation link to <strong>{email}</strong>. Click it to verify and start your will.
          </p>
          <Button variant="outline" href="/verify-email">I clicked the link</Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader title="Create your account" subtitle="Start free. You only pay when you're ready to download." />
      <form onSubmit={handleSubmit} className="stack g-4">
        <Field label="Full legal name" error={errors.fullName} htmlFor="fname" hint="As you'd want it to appear on the will.">
          <Input id="fname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maya Robichaud" leadingIcon={<User size={16} />} />
        </Field>
        <Field label="Email" error={errors.email} htmlFor="email">
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Mail size={16} />} />
        </Field>
        <Field
          label="Password"
          error={errors.password}
          hint={password ? `Strength: ${STRENGTH_LABELS[strength]}` : "At least 8 characters."}
          htmlFor="pw"
        >
          <div style={{ position: "relative" }}>
            <Input id="pw" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Make it a good one" style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 8 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && (
            <div className="row g-1 mt-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < strength ? STRENGTH_COLOR(strength) : "var(--muted)" }} />
              ))}
            </div>
          )}
        </Field>
        <Field label="Province" error={errors.province} hint="Your will follows your province's rules." htmlFor="province">
          <Dropdown id="province" value={province} onChange={(v) => setProvince(v as Province)} options={PROVINCE_OPTIONS} placeholder="Choose your province" />
        </Field>
        <label className="row g-3" style={{ alignItems: "flex-start" }}>
          <input type="checkbox" className="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
          <span className="t-body-sm muted">
            I agree to OwnWill&apos;s <Link className="link" href="/terms">Terms</Link> and <Link className="link" href="/privacy">Privacy Policy</Link>, and understand OwnWill is not a law firm.
          </span>
        </label>
        {errors.agree && <div className="field-error" style={{ marginTop: -4 }}>{errors.agree}</div>}
        <Button type="submit" size="lg" className="btn-block" loading={loading}>
          {loading ? "Creating your account…" : "Create account"}
        </Button>
        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">Already have an account?</span>
          <Button variant="link" href="/login">Log in</Button>
        </div>
      </form>
    </AuthShell>
  );
}
