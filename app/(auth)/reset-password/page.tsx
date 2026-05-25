"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui-kit";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import { passwordStrength, STRENGTH_LABELS } from "@/lib/password";

const STRENGTH_COLOR = (s: number) =>
  s < 2 ? "var(--destructive)" : s < 3 ? "var(--warning)" : "var(--success)";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(pw);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setErr("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <AuthShell>
      <AuthHeader title="Set a new password" subtitle="Pick something only you would think of." />
      {!done ? (
        <form className="stack g-4" onSubmit={handleSubmit}>
          <Field label="New password" error={err.includes("8") ? err : undefined} hint={pw ? `Strength: ${STRENGTH_LABELS[strength]}` : undefined}>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            {pw && (
              <div className="row g-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < strength ? STRENGTH_COLOR(strength) : "var(--muted)" }} />
                ))}
              </div>
            )}
          </Field>
          <Field label="Confirm password" error={err.includes("match") ? err : undefined}>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="btn-block" loading={loading}>Update password</Button>
        </form>
      ) : (
        <div className="stack g-3" style={{ textAlign: "center", alignItems: "center" }}>
          <CheckCircle2 size={40} style={{ color: "var(--success)" }} />
          <h2 className="t-h3">All set</h2>
          <p className="t-body muted">Redirecting to log in…</p>
        </div>
      )}
    </AuthShell>
  );
}
