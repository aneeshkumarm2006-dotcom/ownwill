"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { useShell } from "@/components/app/shell-context";
import { Button, Card, Modal } from "@/components/ui-kit";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { activatePlan } from "@/app/(app)/actions";

const PLAN_LABEL: Record<string, string> = { none: "Free", essentials: "Essentials", premium: "Premium", premium_x2: "Premium ×2" };
const PLAN_PRICE: Record<string, number> = { none: 0, essentials: 129, premium: 199, premium_x2: 299 };

type Plan = "essentials" | "premium" | "premium_x2";

export default function BillingPage() {
  const { user } = useShell();
  const router = useRouter();
  const hasPlan = user.plan !== "none";
  const [show, setShow] = useState(false);
  const [, startTransition] = useTransition();

  function choose(id: string) {
    startTransition(async () => {
      const { error } = await activatePlan(id as Plan);
      if (error) {
        toast.error(error);
        return;
      }
      setShow(false);
      toast.success("Plan activated.");
      router.refresh();
    });
  }

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-h5">Money-back guarantee</div>
        <div className="t-body-sm muted">If you&apos;re not happy within 30 days, we refund — no awkward questions.</div>
      </Card>
      <Card className="stack g-3">
        <div className="t-h5">Free updates for life</div>
        <div className="t-body-sm muted">Edit and re-generate your will any time. No new charges.</div>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb="Account" title="Billing" rail={rail}>
      <Card className="row g-4" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div className="t-overline muted">Current plan</div>
          <div className="t-h3 mt-1">{PLAN_LABEL[user.plan]}</div>
          {hasPlan ? (
            <div className="t-body-sm muted mt-1">Purchased May 12, 2026 · ${PLAN_PRICE[user.plan]} CAD</div>
          ) : (
            <div className="t-body-sm muted mt-1">No subscriptions, ever. Pay once when you&apos;re ready.</div>
          )}
        </div>
        <Button variant={hasPlan ? "outline" : "primary"} onClick={() => setShow(true)}>
          {hasPlan ? "Upgrade" : "Choose a plan"}
        </Button>
      </Card>

      {hasPlan && (
        <Card className="stack g-3 mt-4">
          <div className="t-h5">Receipts</div>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="t-body">{PLAN_LABEL[user.plan]} plan</div>
              <div className="t-caption muted">May 12, 2026 · Visa •••• 4242</div>
            </div>
            <div className="row g-3">
              <span className="t-body">${PLAN_PRICE[user.plan]}.00</span>
              <Button variant="link" icon={<Download size={14} />}>PDF</Button>
            </div>
          </div>
        </Card>
      )}

      {!hasPlan && (
        <div className="mt-8">
          <div className="t-overline muted mb-4">Pick a plan</div>
          <PricingCards onChoose={choose} />
        </div>
      )}

      <Modal open={show} title="Choose a plan" onClose={() => setShow(false)} footer={<Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>}>
        <div className="stack g-3 mt-2">
          <PricingCards onChoose={choose} />
        </div>
      </Modal>
    </AppPage>
  );
}
