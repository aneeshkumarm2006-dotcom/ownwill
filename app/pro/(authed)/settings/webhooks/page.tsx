import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePro, canManageOrg } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Alert, Card } from "@/components/ui-kit";
import { WebhooksManager, type WebhookRow, type DeliveryRow } from "@/components/pro/webhooks-manager";

export const metadata = { title: "Webhooks — OwnWill Pro" };

export default async function ProWebhooksPage() {
  const user = await requirePro();
  const canEdit = canManageOrg(user.role);

  const admin = createAdminClient();
  const [{ data: hooks }, { data: deliveries }] = await Promise.all([
    admin
      .from("organization_webhooks")
      .select(
        "id, url, description, events, status, last_delivery_at, last_success_at, consecutive_failures, created_at, signing_secret",
      )
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false }),
    admin
      .from("organization_webhook_deliveries")
      .select("id, webhook_id, event_type, attempt, status, http_status, error, delivered_at")
      .eq("organization_id", user.organizationId)
      .order("delivered_at", { ascending: false })
      .limit(50),
  ]);

  const rows: WebhookRow[] = (hooks ?? []).map((h) => ({
    id: h.id as string,
    url: h.url as string,
    description: (h.description as string) ?? null,
    events: (h.events as string[]) ?? [],
    status: h.status as WebhookRow["status"],
    lastDeliveryAt: (h.last_delivery_at as string) ?? null,
    lastSuccessAt: (h.last_success_at as string) ?? null,
    consecutiveFailures: (h.consecutive_failures as number) ?? 0,
    createdAt: h.created_at as string,
    secretMasked: `whsec_…${((h.signing_secret as string) ?? "").slice(-6)}`,
  }));

  const deliveryRows: DeliveryRow[] = (deliveries ?? []).map((d) => ({
    id: d.id as string,
    webhookId: d.webhook_id as string,
    eventType: d.event_type as string,
    attempt: d.attempt as number,
    status: d.status as DeliveryRow["status"],
    httpStatus: (d.http_status as number) ?? null,
    error: (d.error as string) ?? null,
    deliveredAt: d.delivered_at as string,
  }));

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="Webhooks"
      description="Receive a signed POST to your endpoint whenever a client document is completed or generated."
      wide
    >
      <div className="stack g-4">
        <Link href="/pro/settings" className="t-body-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Back to settings
        </Link>

        {!canEdit && (
          <Alert variant="info" title="Read-only">
            Webhook configuration is owner/admin only. You can see the list below but can&apos;t change it.
          </Alert>
        )}

        <Card className="stack g-2">
          <span className="t-overline muted">How signing works</span>
          <p className="t-body-sm" style={{ margin: 0 }}>
            Every delivery includes <code>X-OwnWill-Signature: t=&lt;timestamp&gt;,v1=&lt;sha256&gt;</code>.
            Recompute the HMAC with your endpoint&apos;s signing secret over
            <code>&quot;&lt;timestamp&gt;.&lt;raw body&gt;&quot;</code> and compare in constant time.
            Reject deliveries older than 5 minutes to defeat replay.
          </p>
        </Card>

        <WebhooksManager rows={rows} deliveries={deliveryRows} canEdit={canEdit} />
      </div>
    </AppPage>
  );
}
