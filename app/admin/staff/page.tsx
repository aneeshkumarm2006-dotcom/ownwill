import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import {
  StaffGrantForm,
  StaffRevokeButton,
  StaffChangeRoleSelect,
} from "@/components/admin/staff-actions";

type Role = "support" | "admin" | "super_admin";

const ROLE_BADGE: Record<Role, { variant: "completed" | "new"; label: string }> = {
  support: { variant: "completed", label: "Support" },
  admin: { variant: "new", label: "Admin" },
  super_admin: { variant: "new", label: "Super admin" },
};

const STAFF_ROLES: Role[] = ["support", "admin", "super_admin"];

export default async function AdminStaffPage() {
  const user = await requireAdmin();
  if (user.role !== "super_admin") redirect("/admin");

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .in("role", STAFF_ROLES)
    .order("role", { ascending: false })
    .order("created_at", { ascending: true });

  const superCount = (staff ?? []).filter((s) => s.role === "super_admin").length;

  return (
    <AppPage breadcrumb="Admin" title="Staff" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Manage who has admin access. Super-admins can grant, change, or revoke staff roles.
      </p>

      <div className="stack g-4">
        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 12 }}>Grant staff access</h3>
          <StaffGrantForm />
        </Card>

        <Card padded={false}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Current staff</h3>
            <span className="t-caption muted">{staff?.length ?? 0} total · {superCount} super admin</span>
          </div>
          {!staff || staff.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>No staff yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Name</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Email</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Role</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Change role</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => {
                    const role = (s.role as Role) ?? "support";
                    const meta = ROLE_BADGE[role];
                    const isSelf = s.id === user.id;
                    return (
                      <tr key={s.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="t-body-sm" style={{ padding: 12, fontWeight: 600 }}>
                          <Link href={`/admin/users/${s.id}`}>{(s.full_name as string) || "—"}</Link>
                          {isSelf && <span className="t-caption muted" style={{ marginLeft: 6 }}>(you)</span>}
                        </td>
                        <td className="t-body-sm" style={{ padding: 12 }}>{s.email as string}</td>
                        <td style={{ padding: 12 }}><Badge variant={meta.variant}>{meta.label}</Badge></td>
                        <td style={{ padding: 12 }}>
                          {isSelf ? (
                            <span className="t-caption muted">—</span>
                          ) : (
                            <StaffChangeRoleSelect
                              email={s.email as string}
                              currentRole={role}
                            />
                          )}
                        </td>
                        <td style={{ padding: 12 }}>
                          {isSelf ? (
                            <span className="t-caption muted">—</span>
                          ) : (
                            <StaffRevokeButton userId={s.id as string} email={s.email as string} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
