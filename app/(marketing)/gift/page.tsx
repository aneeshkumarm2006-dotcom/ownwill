"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui-kit";
import { MailboxIllo, CelebrateConfetti } from "@/components/illustrations";

export default function GiftPage() {
  const [step, setStep] = useState(0);
  return (
    <section className="py-20">
      <div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="t-overline" style={{ color: "var(--coral-700)" }}>Gift a plan</span>
          <h1 className="t-h1 mt-2">A gift that says &ldquo;I want you around for a long time.&rdquo;</h1>
          <p className="t-body-lg muted mt-3">Give a parent or partner the peace of mind of a finished will.</p>
        </div>
        <div style={{ background: "var(--muted)", borderRadius: 14, padding: 24, minHeight: 200, marginBottom: 24 }}>
          <MailboxIllo />
        </div>
        {step === 0 ? (
          <Card className="stack g-4">
            <Field label="Recipient's name" required>
              <Input placeholder="e.g. Mom" />
            </Field>
            <Field label="Recipient's email" required>
              <Input type="email" placeholder="them@example.com" />
            </Field>
            <Field label="Plan">
              <Select defaultValue="premium">
                <option value="essentials">Essentials — $129</option>
                <option value="premium">Premium — $199</option>
                <option value="premium_x2">Premium ×2 — $299</option>
              </Select>
            </Field>
            <Field label="A short note (optional)" hint="They'll see this with the gift email.">
              <Textarea placeholder="Mom — please. We love you." />
            </Field>
            <Field label="When to deliver">
              <Select defaultValue="now">
                <option value="now">Send now</option>
                <option value="schedule">Schedule a date</option>
              </Select>
            </Field>
            <Button size="lg" onClick={() => setStep(1)}>Continue to payment</Button>
          </Card>
        ) : (
          <Card className="stack g-4" style={{ textAlign: "center", padding: 40, alignItems: "center" }}>
            <div style={{ maxWidth: 280, width: "100%" }}><CelebrateConfetti /></div>
            <h2 className="t-h3">Gift on its way</h2>
            <p className="t-body muted">We&apos;ll email Mom a redemption code right away. You&apos;ll get a confirmation receipt too.</p>
            <Button href="/">Back home</Button>
          </Card>
        )}
      </div>
    </section>
  );
}
