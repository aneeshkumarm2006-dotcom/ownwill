import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

const PAGE_SIZE = 50;

const TYPE_LABEL: Record<string, string> = {
  signing_instructions: "Signing instructions",
};

const STATUS_BADGE: Record<string, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  sent: { variant: "completed", label: "Sent" },
  failed: { variant: "draft", label: "Failed" },
  queued: { variant: "new", label: "Queued" },
};

interface ProfileLite {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, type, status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  let query = admin
    .from("email_logs")
    .select("id, user_id, email_type, to_email, subject, status, sent_at", { count: "exact" })
    .order("sent_at", { ascending: false })
    .range(from, to);

  if (type) query = query.eq("email_type", type);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("to_email", `%${q}%`);

  const { data: rows, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const owners: Record<string, ProfileLite> = {};
  const visibleUserIds = Array.from(
    new Set((rows ?? []).map((r) => r.user_id as string).filter(Boolean)),
  );
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
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `?${s}` : "";
  };

  return (
    <AppPage breadcrumb="Admin" title="Emails" wide>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginTop: -8, marginBottom: 16 }}>
        <p className="t-body muted" style={{ margin: 0 }}>
          {total.toLocaleString()} {total === 1 ? "email" : "emails"}{q ? ` to "${q}"` : ""}.
        </p>
        <Link href="/admin/emails/preview" className="btn btn-outline btn-sm">
          <Eye size={16} style={{ marginRight: 6 }} />
          Template previews
        </Link>
      </div>

      <form className="row g-2 mb-4" style={{ flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} />
          <input name="q" defaultValue={q ?? ""} placeholder="Search recipient email…" className="input" style={{ paddingLeft: 40 }} />
        </div>
        <select name="type" defaultValue={type ?? ""} className="select" style={{ width: 220 }}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="select" style={{ width: 140 }}>
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
        <button type="submit" className="btn btn-outline">Filter</button>
        {(q || type || status) && <a href="/admin/emails" className="btn btn-ghost">Clear</a>}
      </form>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {!rows || rows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>No emails match.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Sent</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Recipient</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Type</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Subject</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const owner = e.user_id ? owners[e.user_id as string] : undefined;
                  const meta = STATUS_BADGE[(e.status as string) ?? ""] ?? { variant: "draft" as const, label: (e.status as string) || "—" };
                  const typeLabel = TYPE_LABEL[(e.email_type as string) ?? ""] ?? (e.email_type as string) ?? "—";
                  return (
                    <tr key={e.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {new Date(e.sent_at as string).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="t-body-sm" style={{ padding: 12 }}>
                        {owner ? (
                          <Link href={`/admin/users/${owner.id}`} style={{ fontWeight: 600 }}>
                            {e.to_email as string}
                          </Link>
                        ) : (
                          <span>{(e.to_email as string) || "—"}</span>
                        )}
                        {owner?.full_name && <div className="t-caption muted">{owner.full_name}</div>}
                      </td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{typeLabel}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(e.subject as string) || "—"}</td>
                      <td style={{ padding: 12 }}><Badge variant={meta.variant}>{meta.label}</Badge></td>
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
            {currentPage > 1 && <a href={`/admin/emails${baseQS(currentPage - 1)}`} className="btn btn-outline btn-sm">Previous</a>}
            {currentPage < totalPages && <a href={`/admin/emails${baseQS(currentPage + 1)}`} className="btn btn-outline btn-sm">Next</a>}
          </div>
        </div>
      )}
    </AppPage>
  );
}
