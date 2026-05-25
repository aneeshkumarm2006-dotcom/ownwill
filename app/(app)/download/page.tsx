"use client";

import { useEffect, useState } from "react";
import { Check, Mail, Printer } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { Button, Card, Progress } from "@/components/ui-kit";
import { CelebrateConfetti, QuillSign } from "@/components/illustrations";
import { DownloadPdfButton } from "@/components/will/download-pdf-button";

export default function DownloadPage() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < 100 ? Math.min(100, p + 7 + Math.random() * 8) : 100));
    }, 250);
    return () => clearInterval(id);
  }, []);
  const ready = progress >= 100;

  const rail = ready ? (
    <div className="stack g-4">
      <Card className="stack g-3" style={{ background: "var(--coral-50)", borderColor: "var(--coral-200)" }}>
        <div className="t-h5">Tell your people</div>
        <div className="t-body-sm muted">Your will is only useful if someone can find it. Email it to your executor.</div>
        <Button variant="outline" size="sm" icon={<Mail size={14} />} style={{ alignSelf: "flex-start" }}>Email executor</Button>
      </Card>
      <Card className="stack g-3">
        <div className="t-h5">What&apos;s next</div>
        <ul className="stack g-2 t-body-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li className="row g-2"><Check size={14} style={{ color: "var(--primary)" }} />Print on plain paper</li>
          <li className="row g-2"><Check size={14} style={{ color: "var(--primary)" }} />Sign with 2 witnesses</li>
          <li className="row g-2"><Check size={14} style={{ color: "var(--primary)" }} />Store somewhere safe</li>
        </ul>
        <Button variant="outline" size="sm" href="/signing">Full instructions</Button>
      </Card>
    </div>
  ) : undefined;

  return (
    <AppPage breadcrumb="Last Will & Testament" title={ready ? "Your will is ready." : "Generating your will…"} rail={rail} narrow>
      <div style={{ maxWidth: 480, margin: "8px auto 0", textAlign: "center" }}>
        <div style={{ maxWidth: 280, margin: "0 auto" }}>{ready ? <CelebrateConfetti /> : <QuillSign />}</div>
        <p className="t-body-lg muted mt-6">
          {ready ? "Download it below and follow the signing instructions we emailed you." : "About 15 seconds. We're translating your answers into a legally valid will for your province."}
        </p>
        {!ready && <div className="mt-6"><Progress value={progress} /></div>}
        {ready && (
          <div className="stack g-3 mt-8">
            <DownloadPdfButton type="will" label="Download Will (PDF)" size="lg" />
            <Button variant="outline" size="lg" href="/documents/will" icon={<Printer size={18} />}>Print version</Button>
            <Button variant="outline" size="lg" href="/signing" icon={<Printer size={18} />}>Signing instructions</Button>
            <Button variant="link" href="/dashboard">Back to dashboard</Button>
          </div>
        )}
      </div>
    </AppPage>
  );
}
