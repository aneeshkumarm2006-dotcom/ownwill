import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePro, canManageOrg } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Alert, Card } from "@/components/ui-kit";
import { ApiKeysManager, type ApiKeyRow } from "@/components/pro/api-keys-manager";

export const metadata = { title: "API keys — OwnWill Pro" };

export default async function ProApiKeysPage() {
  const user = await requirePro();
  const canEdit = canManageOrg(user.role);

  const admin = createAdminClient();
  const { data: keys } = await admin
    .from("organization_api_keys")
    .select("id, name, prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("organization_id", user.organizationId)
    .order("created_at", { ascending: false });

  const rows: ApiKeyRow[] = (keys ?? []).map((k) => ({
    id: k.id as string,
    name: k.name as string,
    prefix: k.prefix as string,
    scopes: (k.scopes as string[]) ?? [],
    lastUsedAt: (k.last_used_at as string) ?? null,
    revokedAt: (k.revoked_at as string) ?? null,
    createdAt: k.created_at as string,
  }));

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="API keys"
      description="Read-only access to your org's client list and document index via the OwnWill REST API."
      wide
    >
      <div className="stack g-4">
        <Link
          href="/pro/settings"
          className="t-body-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to settings
        </Link>

        {!canEdit && (
          <Alert variant="info" title="Read-only">
            API key management is owner/admin only.
          </Alert>
        )}

        <Card className="stack g-2">
          <span className="t-overline muted">Using your key</span>
          <p className="t-body-sm" style={{ margin: 0 }}>
            Send your key as a bearer token: <code>Authorization: Bearer owk_…</code>.
            Base URL: <code>https://ownwill.ca/api/v1</code>. Endpoints:{" "}
            <code>GET /clients</code>, <code>GET /clients/&#123;id&#125;</code>,{" "}
            <code>GET /documents</code>.
          </p>
        </Card>

        <ApiKeysManager rows={rows} canEdit={canEdit} />
      </div>
    </AppPage>
  );
}
