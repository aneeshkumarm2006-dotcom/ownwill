import { ArrowRight, FileText, ScrollText, UserPlus, Users } from "lucide-react";
import { requirePro, canManageOrg } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Button, Card } from "@/components/ui-kit";
import { InviteStaffModal } from "@/components/pro/invite-staff-modal";

export const metadata = { title: "Dashboard — OwnWill Pro" };

async function loadKpis(organizationId: string) {
  const admin = createAdminClient();

  const [activeClients, pendingClientInvites, pendingStaffInvites, teamMembers] = await Promise.all([
    admin
      .from("organization_clients")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    admin
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("kind", "client")
      .is("accepted_at", null),
    admin
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("kind", "staff")
      .is("accepted_at", null),
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  return {
    activeClients: activeClients.count ?? 0,
    pendingClientInvites: pendingClientInvites.count ?? 0,
    pendingStaffInvites: pendingStaffInvites.count ?? 0,
    teamMembers: teamMembers.count ?? 0,
  };
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="stack g-2">
      <div className="t-overline muted">{label}</div>
      <div className="t-h2" style={{ margin: 0 }}>{value}</div>
      {sub && <div className="t-caption muted">{sub}</div>}
    </Card>
  );
}

export default async function ProDashboardPage() {
  const user = await requirePro();
  const k = await loadKpis(user.organizationId);
  const canInvite = canManageOrg(user.role);
  const firstName = user.fullName.split(/\s+/)[0] || "there";

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title={`Welcome, ${firstName}.`}
      wide
      actions={canInvite ? <InviteStaffModal orgName={user.organizationName} /> : undefined}
    >
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 24 }}>
        Phase 1 dashboard — client management, billing, and detailed analytics land in the next
        releases. For now, get your team on board.
      </p>

      <div
        className="grid g-4 kpi-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <Kpi
          label="Active clients"
          value={k.activeClients}
          sub={k.pendingClientInvites > 0 ? `${k.pendingClientInvites} invite${k.pendingClientInvites === 1 ? "" : "s"} pending` : "—"}
        />
        <Kpi
          label="Team members"
          value={k.teamMembers}
          sub={k.pendingStaffInvites > 0 ? `${k.pendingStaffInvites} invite${k.pendingStaffInvites === 1 ? "" : "s"} pending` : "—"}
        />
        <Kpi label="Plan" value={user.role === "owner" ? "Trial" : "—"} sub="Billing arrives in Phase 3" />
        <Kpi label="Audit events (24h)" value="—" sub="Coming in Phase 2" />
      </div>

      <div className="grid g-4 mt-6 split-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card className="stack g-3">
          <div className="row g-2">
            <UserPlus size={18} />
            <h3 className="t-h5" style={{ margin: 0 }}>Get your team on</h3>
          </div>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            Invite paralegals or advisors to {user.organizationName}. They'll get an email link to
            create their account and join.
          </p>
          {canInvite ? (
            <InviteStaffModal orgName={user.organizationName} />
          ) : (
            <Badge variant="locked">Ask an admin to invite teammates</Badge>
          )}
        </Card>

        <Card className="stack g-3">
          <div className="row g-2">
            <Users size={18} />
            <h3 className="t-h5" style={{ margin: 0 }}>Bring in your first clients</h3>
          </div>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            Client invitations open up in Phase 2 — bulk upload, status filters, and full activity
            log. For now you can still invite via the API once it's wired up.
          </p>
          <Button variant="outline" href="/pro/clients" iconRight={<ArrowRight size={14} />}>
            Preview clients
          </Button>
        </Card>
      </div>

      <div className="grid g-4 mt-6 split-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card className="stack g-3">
          <div className="row g-2">
            <FileText size={18} />
            <h3 className="t-h5" style={{ margin: 0 }}>Your firm</h3>
          </div>
          <ul className="stack g-2 t-body-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>
              <strong>Name:</strong> {user.organizationName}
            </li>
            <li>
              <strong>URL slug:</strong> /{user.organizationSlug}
            </li>
            <li>
              <strong>Type:</strong> {user.organizationType}
            </li>
            <li>
              <strong>Your role:</strong> {user.role}
            </li>
          </ul>
        </Card>

        <Card className="stack g-3">
          <div className="row g-2">
            <ScrollText size={18} />
            <h3 className="t-h5" style={{ margin: 0 }}>What's next</h3>
          </div>
          <ul className="stack g-2 t-body-sm muted" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>· Phase 4 — logo upload and branded emails</li>
            <li>· Phase 5 — webhooks, REST API, SSO</li>
          </ul>
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: 1fr 1fr !important; } .split-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 520px) { .kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppPage>
  );
}
