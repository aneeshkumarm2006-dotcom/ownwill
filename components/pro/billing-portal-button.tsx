"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { openBillingPortal } from "@/lib/pro/billing";

/**
 * One-click hop to the hosted Stripe customer portal. Owner-only — gated again
 * server-side so a manually-fetched POST can't sneak past the UI check.
 */
export function BillingPortalButton({ label = "Open billing portal" }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      icon={<ExternalLink size={14} />}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await openBillingPortal();
          if (res?.error) toast.error(res.error);
        })
      }
    >
      {pending ? "Opening…" : label}
    </Button>
  );
}
