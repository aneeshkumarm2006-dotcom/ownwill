"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";

export function LoginForm() {
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
    if (!email.includes("@")) errs.email = "Please enter a valid email.";
    if (!password) errs.password = "Password is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell>
      <AuthHeader title="Welcome back" subtitle="Sign in to pick up where you left off." />
      <form onSubmit={handleSubmit} className="stack g-4">
        <Field label="Email" error={errors.email} htmlFor="email">
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Mail size={16} />} />
        </Field>
        <Field label="Password" error={errors.password} htmlFor="pw">
          <div style={{ position: "relative" }}>
            <Input id="pw" type={showPw ? "text" : "password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 8 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button variant="link" href="/forgot-password">Forgot password?</Button>
        </div>
        <Button type="submit" size="lg" loading={loading} className="btn-block">
          {loading ? "Signing in…" : "Log in"}
        </Button>
        <div className="row g-2" style={{ alignItems: "center" }}>
          <hr className="hr" style={{ flex: 1 }} />
          <span className="t-caption muted">or</span>
          <hr className="hr" style={{ flex: 1 }} />
        </div>
        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">New here?</span>
          <Button variant="link" href="/signup">Create an account</Button>
        </div>
      </form>
    </AuthShell>
  );
}
