"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Eye, EyeOff, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { ShieldHands } from "@/components/illustrations";
import { isValidEmail } from "@/lib/validation/email";

// Accept only same-origin paths under /pro so a crafted ?redirectTo can't push
// the just-signed-in Pro user somewhere unexpected.
function safeProRedirect(value: string | null): string {
  if (!value) return "/pro/dashboard";
  return /^\/pro(\/|$)/.test(value) && !value.startsWith("//") ? value : "/pro/dashboard";
}

export function ProLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!isValidEmail(email)) errs.email = "Please enter a valid email.";
    if (!password) errs.password = "Password is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign in failed.");
      return;
    }

    setLoading(false);
    // requirePro() in the (authed) layout will validate org membership; if the
    // user happens to have no Pro membership it bounces them back here.
    const redirectTo = safeProRedirect(searchParams.get("redirectTo"));
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell illustration={<ShieldHands />}>
      <AuthHeader
        title="Pro sign in"
        subtitle="Access your firm's OwnWill Pro portal."
      />
      <div className="stack g-4">
        <div
          className="row g-2"
          style={{
            alignItems: "center",
            padding: "10px 12px",
            background: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--muted-foreground)",
          }}
        >
          <Briefcase size={16} aria-hidden="true" />
          <span className="t-caption">For firm staff. Clients sign in to the regular account.</span>
        </div>

        <form onSubmit={handleSubmit} className="stack g-4">
          <Field label="Work email" error={errors.email} htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="you@firm.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={16} />}
              autoComplete="email"
            />
          </Field>
          <Field label="Password" error={errors.password} htmlFor="pw">
            <div style={{ position: "relative" }}>
              <Input
                id="pw"
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                aria-controls="pw"
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
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button variant="link" href="/forgot-password">Forgot password?</Button>
          </div>
          <Button type="submit" size="lg" loading={loading} className="btn-block">
            {loading ? "Signing in…" : "Sign in to Pro"}
          </Button>
        </form>

        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">New to OwnWill Pro?</span>
          <Button variant="link" href="/pro/signup">Create your firm</Button>
        </div>
        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <Button variant="link" href="/login">Customer sign in</Button>
          <span className="muted">·</span>
          <Button variant="link" href="/admin/login">Staff sign in</Button>
        </div>
      </div>
    </AuthShell>
  );
}
