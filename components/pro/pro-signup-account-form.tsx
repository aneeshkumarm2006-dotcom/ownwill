"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { MailboxIllo } from "@/components/illustrations";
import { passwordStrength, STRENGTH_LABELS } from "@/lib/password";
import { isValidEmail } from "@/lib/validation/email";

const FULL_NAME_MAX = 120;
const STRENGTH_COLOR = (s: number) =>
  s < 2 ? "var(--destructive)" : s < 3 ? "var(--warning)" : "var(--success)";

/**
 * Step 1 of the Pro signup wizard: collect account info. On success either
 * the user is auto-signed-in (Supabase email confirmation off) and we send
 * them to /pro/signup which falls through to the org form, or email
 * confirmation is required and we show a "check your email" message.
 */
export function ProSignupAccountForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const cleanName = fullName.trim().slice(0, FULL_NAME_MAX);
    if (!cleanName) errs.fullName = "Please enter your full name.";
    if (!isValidEmail(email)) errs.email = "Please enter a valid work email.";
    if (password.length < 8) errs.password = "Use at least 8 characters.";
    if (!agree) errs.agree = "Please agree to continue.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: cleanName, signup_intent: "pro" },
        // Land back on /pro/signup after email verification so the user
        // continues the wizard and creates their org.
        emailRedirectTo: `${window.location.origin}/pro/signup`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      // Auto-confirmed — drop straight into the org-details step. The page
      // reload picks up the session and renders the org form.
      window.location.assign("/pro/signup");
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
            We sent a confirmation link to <strong>{email}</strong>. Click it to verify your
            account; we'll bring you back here to finish setting up your firm.
          </p>
          <Button variant="outline" href="/verify-email">I clicked the link</Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        title="Create your firm"
        subtitle="Step 1 of 2 — your account. You'll set up the firm's details next."
      />
      <form onSubmit={handleSubmit} className="stack g-4">
        <Field label="Your full name" error={errors.fullName} htmlFor="fname">
          <Input
            id="fname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Maya Robichaud"
            leadingIcon={<User size={16} />}
            autoComplete="name"
          />
        </Field>
        <Field label="Work email" error={errors.email} htmlFor="email" hint="Use the email you'd want clients to reply to.">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@firm.ca"
            leadingIcon={<Mail size={16} />}
            autoComplete="email"
          />
        </Field>
        <Field
          label="Password"
          error={errors.password}
          hint={password ? `Strength: ${STRENGTH_LABELS[strength]}` : "At least 8 characters."}
          htmlFor="pw"
        >
          <div style={{ position: "relative" }}>
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Make it a good one"
              autoComplete="new-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                padding: 8,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && (
            <div className="row g-1 mt-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    background: i < strength ? STRENGTH_COLOR(strength) : "var(--muted)",
                  }}
                />
              ))}
            </div>
          )}
        </Field>
        <label className="row g-3" style={{ alignItems: "flex-start" }}>
          <input
            type="checkbox"
            className="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span className="t-body-sm muted">
            I agree to OwnWill's <Link className="link" href="/terms">Terms</Link> and{" "}
            <Link className="link" href="/privacy">Privacy Policy</Link>, and understand OwnWill
            is not a law firm.
          </span>
        </label>
        {errors.agree && <div className="field-error" style={{ marginTop: -4 }}>{errors.agree}</div>}
        <Button type="submit" size="lg" className="btn-block" loading={loading}>
          {loading ? "Creating your account…" : "Continue to firm details"}
        </Button>
        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">Already have a Pro account?</span>
          <Button variant="link" href="/pro/login">Sign in</Button>
        </div>
      </form>
    </AuthShell>
  );
}
