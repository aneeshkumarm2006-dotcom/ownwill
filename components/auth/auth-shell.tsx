"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { LeafMark } from "@/components/brand/logo";
import { PaperFold } from "@/components/illustrations";

export function AuthShell({
  children,
  illustration,
}: {
  children: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="auth-shell" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div
        className="auth-brand"
        style={{
          background: "linear-gradient(160deg, var(--teal-800) 0%, var(--teal-900) 100%)",
          color: "#F0FAF9",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="row" style={{ gap: 8 }}>
          <LeafMark size={32} color="#F0FAF9" accent="var(--coral-400)" />
          <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em" }}>OwnWill</span>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 360, margin: "32px auto" }}>{illustration || <PaperFold />}</div>
          <blockquote style={{ margin: "32px 0 0", fontSize: 18, fontWeight: 500, textWrap: "balance", maxWidth: 360 }}>
            &ldquo;I started three different times and never finished. With OwnWill, I did it in one nap.&rdquo;
          </blockquote>
          <div className="t-body-sm" style={{ marginTop: 12, opacity: 0.8 }}>Maya R. — Toronto</div>
        </div>
        <div className="t-caption" style={{ opacity: 0.7 }}>© 2026 OwnWill · Made with care in Canada</div>
        <div style={{ position: "absolute", right: -80, top: -80, opacity: 0.12 }}>
          <LeafMark size={320} color="#F0FAF9" accent="var(--coral-400)" />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "var(--background)" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>{children}</div>
      </div>
      <style>{`@media (max-width: 900px) {
        .auth-shell { grid-template-columns: 1fr !important; }
        .auth-brand { display: none !important; }
      }`}</style>
    </div>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 stack g-3">
      <Link href="/" className="row g-2 focusable" style={{ textDecoration: "none", color: "var(--muted-foreground)", fontSize: 14 }}>
        <ArrowLeft size={14} />
        Back to home
      </Link>
      <h1 className="t-h2">{title}</h1>
      {subtitle && <p className="t-body muted">{subtitle}</p>}
    </div>
  );
}
