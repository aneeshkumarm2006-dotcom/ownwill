import Link from "next/link";
import { ArrowUpRight, Key, Webhook } from "lucide-react";
import { canManageOrg, requirePro } from "@/lib/pro/auth";
import { getOrgBranding } from "@/lib/pro/branding";
import { AppPage } from "@/components/app/app-page";
import { Card } from "@/components/ui-kit";
import { BrandingForm } from "@/components/pro/branding-form";

export const metadata = { title: "Settings — OwnWill Pro" };

export default async function ProSettingsPage() {
  const user = await requirePro();
  const branding = await getOrgBranding(user.organizationId);
  const canEdit = canManageOrg(user.role);

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="Settings"
      description="Configure how your firm appears to clients on invitation emails."
      wide
    >
      <div className="stack g-4">
        <Card className="stack g-2">
          <span className="t-overline muted">Organization</span>
          <div className="t-h5" style={{ margin: 0 }}>
            {user.organizationName}{" "}
            <span className="t-caption muted">/ {user.organizationSlug}</span>
          </div>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            URL slug, organization type, and vanity subdomain renames aren&apos;t available yet —
            they need redirect plumbing that lands in a later phase.
          </p>
        </Card>

        <BrandingForm
          initialName={branding?.name ?? user.organizationName}
          initialPrimaryColor={branding?.primaryColor ?? ""}
          logoUrl={branding?.logoUrl ?? null}
          canEdit={canEdit}
        />

        <div className="row g-3" style={{ flexWrap: "wrap" }}>
          <Link
            href="/pro/settings/webhooks"
            className="card card-pad card-interactive stack g-2"
            style={{ flex: "1 1 280px", textDecoration: "none", color: "inherit" }}
          >
            <div className="row g-2" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <span className="row g-2" style={{ alignItems: "center" }}>
                <Webhook size={16} />
                <span className="t-h6" style={{ margin: 0 }}>Webhooks</span>
              </span>
              <ArrowUpRight size={14} className="muted" />
            </div>
            <span className="t-body-sm muted">
              Receive signed POSTs to your endpoint on document completed/generated events.
            </span>
          </Link>
          <Link
            href="/pro/settings/api-keys"
            className="card card-pad card-interactive stack g-2"
            style={{ flex: "1 1 280px", textDecoration: "none", color: "inherit" }}
          >
            <div className="row g-2" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <span className="row g-2" style={{ alignItems: "center" }}>
                <Key size={16} />
                <span className="t-h6" style={{ margin: 0 }}>API keys</span>
              </span>
              <ArrowUpRight size={14} className="muted" />
            </div>
            <span className="t-body-sm muted">
              Generate org-scoped read tokens for the OwnWill REST API (CRM/data sync).
            </span>
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
