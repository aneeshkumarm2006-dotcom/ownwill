"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { ShieldHands } from "@/components/illustrations";
import { isValidEmail } from "@/lib/validation/email";

// Accept only same-origin paths under /admin so staff can't be redirected
// elsewhere via a crafted ?redirectTo.
function safeAdminRedirect(value: string | null): string {
  if (!value) return "/admin";
  return /^\/admin(\/|$)/.test(value) && !value.startsWith("//") ? value : "/admin";
}

const STAFF_ROLES = new Set(["support", "admin", "super_admin"]);

export function AdminLoginForm() {
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

    // Verify the user is staff. If not, sign them out so they aren't left in
    // a half-state with a customer session created by the admin login screen.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    const role = (profile?.role as string) ?? "customer";

    if (!STAFF_ROLES.has(role)) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("This account doesn't have staff access.");
      return;
    }

    setLoading(false);
    const redirectTo = safeAdminRedirect(searchParams.get("redirectTo"));
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell illustration={<ShieldHands />}>
      <AuthHeader
        title="Staff sign in"
        subtitle="Access to OwnWill admin. Customers — use the regular sign-in page."
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
          <ShieldCheck size={16} aria-hidden="true" />
          <span className="t-caption">Restricted — staff accounts only.</span>
        </div>

        <form onSubmit={handleSubmit} className="stack g-4">
          <Field label="Work email" error={errors.email} htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="you@ownwill.ca"
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
                {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button variant="link" href="/forgot-password">Forgot password?</Button>
          </div>
          <Button type="submit" size="lg" loading={loading} className="btn-block">
            {loading ? "Signing in…" : "Sign in to admin"}
          </Button>
        </form>

        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">Not staff?</span>
          <Button variant="link" href="/login">Customer sign in</Button>
        </div>
      </div>
    </AuthShell>
  );
}
