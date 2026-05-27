import { requireAdmin } from "@/lib/admin/auth";
import { AppPage } from "@/components/app/app-page";
import { ComingSoon } from "@/components/admin/coming-soon";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  return (
    <AppPage breadcrumb="Admin" title="Payments" wide>
      <ComingSoon
        title="Payments panel coming next"
        description="Browse every payment, refund through Stripe, and grant comp plans manually."
        bullets={[
          "List of payments with Stripe IDs + status",
          "Issue refund (writes refunded_at/refund_reason)",
          "Manual plan grants & revokes (audited)",
          "Link out to Stripe dashboard for each transaction",
        ]}
      />
    </AppPage>
  );
}
