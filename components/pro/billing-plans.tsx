"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui-kit";
import { startProCheckout } from "@/lib/pro/billing";
import { PRO_PLANS, formatCAD, planForSeatCount, type ProPlan } from "@/lib/stripe/pricing";

const ORDERED: ProPlan[] = ["pro_starter", "pro_team", "pro_enterprise"];

interface Props {
  /** Existing seat count so the picker starts where they are today. */
  initialSeats: number;
  /** True once the org has any Stripe sub (lets us hide "Choose plan" buttons). */
  hasSubscription: boolean;
  currentPlan: ProPlan | null;
}

/**
 * Plan picker shown on /pro/billing before the org has subscribed. Once a
 * subscription exists, the page hides this and uses the Stripe portal for
 * upgrades/downgrades — keeps state changes funnelled through Stripe's UI.
 */
export function BillingPlans({ initialSeats, hasSubscription, currentPlan }: Props) {
  const [seats, setSeats] = useState<number>(Math.max(initialSeats || 1, 1));
  const [pending, startTransition] = useTransition();
  const suggested = planForSeatCount(seats);

  function choose(plan: ProPlan) {
    const cfg = PRO_PLANS[plan];
    if (!cfg.selfServe) {
      // Enterprise tier — bounce to email. Use anchor click instead of mutating
      // window.location so the React Compiler immutability rule is happy.
      const a = document.createElement("a");
      a.href = "mailto:sales@ownwill.ca?subject=OwnWill%20Pro%20Enterprise%20inquiry";
      a.click();
      return;
    }
    startTransition(async () => {
      const res = await startProCheckout({ plan, seatCount: seats });
      // startProCheckout `redirect()`s on success — only the error path returns.
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <Card className="stack g-4">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 className="t-h5" style={{ margin: 0 }}>
          {hasSubscription ? "Change plan" : "Choose a plan"}
        </h3>
        <span className="t-caption muted">CAD · billed monthly · per seat</span>
      </div>

      <Field label="How many staff seats do you need?" hint="Members + admins + owner. Viewers count too.">
        <Input
          type="number"
          min={1}
          max={250}
          value={String(seats)}
          onChange={(e) => setSeats(Math.max(1, Math.min(250, Number(e.target.value) || 1)))}
          style={{ maxWidth: 160 }}
        />
      </Field>

      <div className="grid g-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {ORDERED.map((key) => {
          const cfg = PRO_PLANS[key];
          const isSuggested = suggested === key;
          const isCurrent = currentPlan === key;
          const total = cfg.monthlyPerSeat * seats;
          const inRange =
            seats >= cfg.seatMin && (cfg.seatMax === null || seats <= cfg.seatMax);
          return (
            <div
              key={key}
              className="card stack g-3"
              style={{
                padding: 16,
                borderWidth: isSuggested ? 2 : 1,
                borderColor: isSuggested ? "var(--primary)" : "var(--border)",
                position: "relative",
              }}
            >
              {isSuggested && (
                <span
                  className="t-caption"
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 12,
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  Recommended
                </span>
              )}
              <div>
                <div className="row g-2">
                  <span className="t-h5" style={{ margin: 0 }}>{cfg.name}</span>
                  {isCurrent && <span className="t-caption muted">(current)</span>}
                </div>
                <div className="t-caption muted">
                  {cfg.seatMax === null
                    ? `${cfg.seatMin}+ seats`
                    : `${cfg.seatMin}–${cfg.seatMax} seats`}
                </div>
              </div>
              <div>
                {cfg.monthlyPerSeat > 0 ? (
                  <>
                    <div className="t-h4">{formatCAD(cfg.monthlyPerSeat)}</div>
                    <div className="t-caption muted">per seat / month</div>
                  </>
                ) : (
                  <>
                    <div className="t-h4">Custom</div>
                    <div className="t-caption muted">contact sales</div>
                  </>
                )}
              </div>
              <p className="t-body-sm muted" style={{ margin: 0 }}>{cfg.blurb}</p>
              <ul className="stack g-1 t-body-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li className="row g-2"><Check size={14} /> Unlimited clients</li>
                <li className="row g-2"><Check size={14} /> Audit log + activity history</li>
                <li className="row g-2"><Check size={14} /> Logo on client emails</li>
              </ul>
              {inRange && cfg.monthlyPerSeat > 0 && (
                <div className="t-body-sm" style={{ fontWeight: 600 }}>
                  {formatCAD(total)} / month for {seats} seat{seats === 1 ? "" : "s"}
                </div>
              )}
              <Button
                onClick={() => choose(key)}
                disabled={pending || (!inRange && cfg.selfServe)}
                variant={isSuggested ? undefined : "outline"}
                icon={cfg.selfServe ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
              >
                {!cfg.selfServe
                  ? "Contact sales"
                  : !inRange
                    ? "Seats out of range"
                    : isCurrent
                      ? "Manage in portal"
                      : "Start checkout"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
