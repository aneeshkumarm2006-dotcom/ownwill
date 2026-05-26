"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

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
      <div className="stack g-4">
        <Button variant="outline" size="lg" className="btn-block" icon={<GoogleIcon />} loading={googleLoading} onClick={handleGoogleSignIn}>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </Button>
        <div className="row g-2" style={{ alignItems: "center" }}>
          <hr className="hr" style={{ flex: 1 }} />
          <span className="t-caption muted">or</span>
          <hr className="hr" style={{ flex: 1 }} />
        </div>
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
        </form>
        <div className="row g-2 t-body-sm" style={{ justifyContent: "center" }}>
          <span className="muted">New here?</span>
          <Button variant="link" href="/signup">Create an account</Button>
        </div>
      </div>
    </AuthShell>
  );
}
