"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { AuthShell } from "@/components/auth/auth-shell";
import { CelebrateConfetti } from "@/components/illustrations";

export default function VerifyEmailPage() {
  return (
    <AuthShell illustration={<CelebrateConfetti />}>
      <div className="stack g-4" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 200, margin: "0 auto" }}><CelebrateConfetti /></div>
        <h1 className="t-h2">You&apos;re verified.</h1>
        <p className="t-body muted">Welcome to OwnWill. Let&apos;s get started on your will.</p>
        <Button size="lg" className="btn-block" href="/dashboard" iconRight={<ArrowRight size={18} />}>
          Go to dashboard
        </Button>
      </div>
    </AuthShell>
  );
}
