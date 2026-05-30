import { requirePro, canManageOrg } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { InviteStaffModal } from "@/components/pro/invite-staff-modal";

export const metadata = { title: "Team — OwnWill Pro" };

interface MemberRow {
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  accepted_at: string | null;
  profiles: { email: string; full_name: string | null } | null;
}

interface InviteRow {
  id: string;
  email: string;
  role: string | null;
  invited_at: string;
  expires_at: string;
}

const ROLE_LABEL = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
} as const;

export default async function ProTeamPage() {
  const user = await requirePro();
  const canInvite = canManageOrg(user.role);

  const admin = createAdminClient();
  const [{ data: members }, { data: invites }] = await Promise.all([
    admin
      .from("organization_members")
      .select("user_id, role, accepted_at, profiles:user_id ( email, full_name )")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: true })
      .returns<MemberRow[]>(),
    admin
      .from("organization_invitations")
      .select("id, email, role, created_at, expires_at, accepted_at")
      .eq("organization_id", user.organizationId)
      .eq("kind", "staff")
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .returns<(InviteRow & { created_at: string; accepted_at: string | null })[]>(),
  ]);

  const pendingInvites = (invites ?? []).filter(
    (i) => new Date(i.expires_at).getTime() > Date.now(),
  );

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="Team"
      wide
      actions={canInvite ? <InviteStaffModal orgName={user.organizationName} /> : undefined}
    >
      <div className="stack g-4">
        <Card className="stack g-3">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 className="t-h5" style={{ margin: 0 }}>Members</h3>
            <span className="t-caption muted">{(members ?? []).length} total</span>
          </div>
          {(members ?? []).length === 0 ? (
            <p className="t-body-sm muted">No teammates yet.</p>
          ) : (
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(members ?? []).map((m) => (
                <li
                  key={m.user_id}
                  className="row"
                  style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="t-body-sm" style={{ fontWeight: 600 }}>
                      {m.profiles?.full_name || m.profiles?.email || "—"}
                    </div>
                    <div className="t-caption muted">{m.profiles?.email}</div>
                  </div>
                  <Badge variant={m.role === "owner" ? "paid" : "completed"}>{ROLE_LABEL[m.role]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="stack g-3">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 className="t-h5" style={{ margin: 0 }}>Pending invitations</h3>
            <span className="t-caption muted">{pendingInvites.length} open</span>
          </div>
          {pendingInvites.length === 0 ? (
            <p className="t-body-sm muted">No pending invitations.</p>
          ) : (
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="row"
                  style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="t-body-sm" style={{ fontWeight: 600 }}>{inv.email}</div>
                    <div className="t-caption muted">
                      Expires {new Date(inv.expires_at).toLocaleDateString("en-CA")}
                    </div>
                  </div>
                  <Badge variant="draft">{inv.role ?? "member"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
