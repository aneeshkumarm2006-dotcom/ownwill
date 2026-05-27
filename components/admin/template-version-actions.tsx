"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Play, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui-kit";
import {
  approveVersion,
  activateVersion,
  retireVersion,
  submitForReview,
} from "@/app/admin/(authed)/templates/actions";

type Status = "draft" | "in_review" | "approved" | "retired";

export function TemplateVersionActions({
  id,
  status,
  isActive,
}: {
  id: string;
  status: Status;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  return (
    <div className="row g-2" style={{ flexWrap: "wrap" }}>
      {status === "draft" && (
        <Button
          size="sm"
          variant="outline"
          icon={<Send size={14} />}
          disabled={pending}
          onClick={() => run(() => submitForReview(id), "Sent for review.")}
        >
          Submit for review
        </Button>
      )}
      {status === "in_review" && (
        <Button
          size="sm"
          icon={<CheckCircle2 size={14} />}
          disabled={pending}
          onClick={() => run(() => approveVersion(id), "Approved.")}
        >
          Approve
        </Button>
      )}
      {status === "approved" && !isActive && (
        <Button
          size="sm"
          icon={<Play size={14} />}
          disabled={pending}
          onClick={() => run(() => activateVersion(id), "Activated.")}
        >
          Activate
        </Button>
      )}
      {status === "approved" && !isActive && (
        <Button
          size="sm"
          variant="outline"
          icon={<Archive size={14} />}
          disabled={pending}
          onClick={() => run(() => retireVersion(id), "Retired.")}
        >
          Retire
        </Button>
      )}
    </div>
  );
}
