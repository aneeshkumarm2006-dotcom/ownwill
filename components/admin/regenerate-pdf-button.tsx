"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { regeneratePdf } from "@/app/admin/(authed)/documents/actions";

export function RegeneratePdfButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      icon={<RefreshCw size={16} />}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await regeneratePdf(documentId);
          if (r.error) toast.error(r.error);
          else {
            toast.success("PDF regenerated.");
            router.refresh();
          }
        })
      }
    >
      {pending ? "Regenerating…" : "Regenerate PDF"}
    </Button>
  );
}
