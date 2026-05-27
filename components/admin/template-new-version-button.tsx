"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { createVersion } from "@/app/admin/templates/actions";
import type { DocType, ProvinceCode } from "@/lib/admin/templates";

export function TemplateNewVersionButton({
  type,
  province,
}: {
  type: DocType;
  province: ProvinceCode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      icon={<Plus size={16} />}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await createVersion({ type, province });
          if (r.error) toast.error(r.error);
          else {
            toast.success("New draft version created.");
            router.refresh();
          }
        })
      }
    >
      {pending ? "Creating…" : "New draft version"}
    </Button>
  );
}
