import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

const PAGE_SIZE = 25;

const DOC_TYPE_LABEL: Record<string, string> = {
  will: "Will",
  poa_health: "POA — Health",
  poa_property: "POA — Property",
  asset_list: "Asset list",
};

const DOC_STATUS_BADGE: Record<string, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  draft: { variant: "draft", label: "Draft" },
  completed: { variant: "completed", label: "Completed" },
  paid: { variant: "paid", label: "Paid" },
  generated: { variant: "new", label: "Generated" },
};

interface ProfileLite {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; province?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, type, status, province, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // If searching by user email/name, prefilter to those user IDs.
  let userIds: string[] | null = null;
  if (q) {
    const { data: matchedUsers } = await admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(500);
    userIds = (matchedUsers ?? []).map((u) => u.id as string);
    if (userIds.length === 0) userIds = ["00000000-0000-0000-0000-000000000000"];
  }

  let query = admin
    .from("documents")
    .select("id, user_id, type, status, province, version, pdf_generated_at, updated_at, is_current", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (province) query = query.eq("province", province);
  if (userIds) query = query.in("user_id", userIds);

  const { data: rows, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Hydrate user names for the visible rows in one shot.
  const owners: Record<string, ProfileLite> = {};
  const visibleUserIds = Array.from(new Set((rows ?? []).map((r) => r.user_id as string)));
  if (visibleUserIds.length) {
    const { data: ownerRows } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", visibleUserIds);
    for (const o of ownerRows ?? []) owners[o.id as string] = o as ProfileLite;
  }

  const baseQS = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (type) u.set("type", type);
    if (status) u.set("status", status);
    if (province) u.set("province", province);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `?${s}` : "";
  };

  return (
    <AppPage breadcrumb="Admin" title="Documents" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        {total.toLocaleString()} {total === 1 ? "document" : "documents"}{q ? ` for users matching "${q}"` : ""}.
      </p>

      <form className="row g-2 mb-4" style={{ flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} />
          <input name="q" defaultValue={q ?? ""} placeholder="Search user email or name…" className="input" style={{ paddingLeft: 40 }} />
        </div>
        <select name="type" defaultValue={type ?? ""} className="select" style={{ width: 180 }}>
          <option value="">All types</option>
          <option value="will">Will</option>
          <option value="poa_health">POA — Health</option>
          <option value="poa_property">POA — Property</option>
          <option value="asset_list">Asset list</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="select" style={{ width: 160 }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="paid">Paid</option>
          <option value="generated">Generated</option>
        </select>
        <select name="province" defaultValue={province ?? ""} className="select" style={{ width: 140 }}>
          <option value="">All provinces</option>
          {["ON","BC","AB","MB","NB","NL","NS","PE","SK","QC"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-outline">Filter</button>
        {(q || type || status || province) && <a href="/admin/documents" className="btn btn-ghost">Clear</a>}
      </form>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {!rows || rows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>No documents match.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Type</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Owner</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Province</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>v</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Updated</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const meta = DOC_STATUS_BADGE[(d.status as string) ?? "draft"] ?? DOC_STATUS_BADGE.draft;
                  const owner = owners[d.user_id as string];
                  return (
                    <tr key={d.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: 0 }}>
                        <Link href={`/admin/documents/${d.id}`} style={{ display: "block", padding: 12, textDecoration: "none", color: "inherit" }}>
                          <span className="t-body-sm" style={{ fontWeight: 600 }}>
                            {DOC_TYPE_LABEL[(d.type as string) ?? ""] ?? (d.type as string)}
                          </span>
                          {!d.is_current && <span className="t-caption muted" style={{ marginLeft: 6 }}>(prev)</span>}
                        </Link>
                      </td>
                      <td style={{ padding: 12 }}>
                        {owner ? (
                          <Link href={`/admin/users/${owner.id}`} className="t-body-sm" style={{ fontWeight: 600 }}>
                            {owner.full_name || owner.email}
                          </Link>
                        ) : (
                          <span className="t-body-sm muted">{(d.user_id as string).slice(0, 8)}…</span>
                        )}
                        {owner?.full_name && <div className="t-caption muted">{owner.email}</div>}
                      </td>
                      <td style={{ padding: 12 }}><Badge variant={meta.variant}>{meta.label}</Badge></td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(d.province as string) || "—"}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{d.version as number}</td>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {new Date(d.updated_at as string).toLocaleDateString("en-CA")}
                      </td>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {d.pdf_generated_at ? new Date(d.pdf_generated_at as string).toLocaleDateString("en-CA") : "—"}
                      </td>
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
            {currentPage > 1 && <a href={`/admin/documents${baseQS(currentPage - 1)}`} className="btn btn-outline btn-sm">Previous</a>}
            {currentPage < totalPages && <a href={`/admin/documents${baseQS(currentPage + 1)}`} className="btn btn-outline btn-sm">Next</a>}
          </div>
        </div>
      )}
    </AppPage>
  );
}
