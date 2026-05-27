import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

const PAGE_SIZE = 25;

const PLAN_BADGE: Record<string, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  none: { variant: "draft", label: "Free" },
  essentials: { variant: "completed", label: "Essentials" },
  premium: { variant: "paid", label: "Premium" },
  premium_x2: { variant: "new", label: "Premium ×2" },
};

const ROLE_BADGE: Record<string, { variant: "draft" | "completed" | "new"; label: string }> = {
  customer: { variant: "draft", label: "Customer" },
  support: { variant: "completed", label: "Support" },
  admin: { variant: "new", label: "Admin" },
  super_admin: { variant: "new", label: "Super admin" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; role?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, plan, role, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, email, full_name, province, plan, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  if (plan) query = query.eq("plan", plan);
  if (role) query = query.eq("role", role);

  const { data: rows, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseQS = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (plan) u.set("plan", plan);
    if (role) u.set("role", role);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `?${s}` : "";
  };

  return (
    <AppPage breadcrumb="Admin" title="Users" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        {total.toLocaleString()} {total === 1 ? "user" : "users"}{q ? ` matching "${q}"` : ""}.
      </p>

      <form className="row g-2 mb-4" style={{ flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} />
          <input name="q" defaultValue={q ?? ""} placeholder="Search email or name…" className="input" style={{ paddingLeft: 40 }} />
        </div>
        <select name="plan" defaultValue={plan ?? ""} className="select" style={{ width: 160 }}>
          <option value="">All plans</option>
          <option value="none">Free</option>
          <option value="essentials">Essentials</option>
          <option value="premium">Premium</option>
          <option value="premium_x2">Premium ×2</option>
        </select>
        <select name="role" defaultValue={role ?? ""} className="select" style={{ width: 160 }}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <button type="submit" className="btn btn-outline">Filter</button>
        {(q || plan || role) && <a href="/admin/users" className="btn btn-ghost">Clear</a>}
      </form>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {!rows || rows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>No users match.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Name</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Email</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Province</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Plan</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Role</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const planMeta = PLAN_BADGE[(u.plan as string) ?? "none"] ?? PLAN_BADGE.none;
                  const roleMeta = ROLE_BADGE[(u.role as string) ?? "customer"] ?? ROLE_BADGE.customer;
                  return (
                    <tr key={u.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: 0 }}>
                        <Link href={`/admin/users/${u.id}`} style={{ display: "block", padding: 12, textDecoration: "none", color: "inherit" }}>
                          <span className="t-body-sm" style={{ fontWeight: 600 }}>{(u.full_name as string) || "—"}</span>
                        </Link>
                      </td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{u.email as string}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(u.province as string) || "—"}</td>
                      <td style={{ padding: 12 }}><Badge variant={planMeta.variant}>{planMeta.label}</Badge></td>
                      <td style={{ padding: 12 }}><Badge variant={roleMeta.variant}>{roleMeta.label}</Badge></td>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{new Date(u.created_at as string).toLocaleDateString("en-CA")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="row mt-4" style={{ justifyContent: "space-between" }}>
          <span className="t-caption muted">Page {currentPage} of {totalPages}</span>
          <div className="row g-2">
            {currentPage > 1 && <a href={`/admin/users${baseQS(currentPage - 1)}`} className="btn btn-outline btn-sm">Previous</a>}
            {currentPage < totalPages && <a href={`/admin/users${baseQS(currentPage + 1)}`} className="btn btn-outline btn-sm">Next</a>}
          </div>
        </div>
      )}
    </AppPage>
  );
}
