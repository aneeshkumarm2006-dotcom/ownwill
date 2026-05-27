import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  await requireAdmin();
  const { action, actor } = await searchParams;

  const admin = createAdminClient();
  let q = admin
    .from("admin_audit_log")
    .select("id, actor_id, actor_email, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (action) q = q.eq("action", action);
  if (actor) q = q.ilike("actor_email", `%${actor}%`);
  const { data: rows } = await q;

  return (
    <AppPage breadcrumb="Admin" title="Audit log" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 24 }}>
        Append-only record of every admin action. Showing the most recent {PAGE_SIZE}.
      </p>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {!rows || rows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>No admin actions logged yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>When</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Actor</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Action</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Target</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{new Date(r.created_at as string).toLocaleString("en-CA")}</td>
                    <td className="t-body-sm" style={{ padding: 12 }}>{(r.actor_email as string) ?? "—"}</td>
                    <td style={{ padding: 12 }}><Badge variant="info">{r.action as string}</Badge></td>
                    <td className="t-body-sm" style={{ padding: 12 }}>
                      {r.target_type ? <span className="muted">{r.target_type as string}</span> : "—"}
                      {r.target_id ? <code style={{ marginLeft: 6, fontSize: 12 }}>{(r.target_id as string).slice(0, 8)}</code> : null}
                    </td>
                    <td className="t-caption" style={{ padding: 12, color: "var(--muted-foreground)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {Object.keys((r.metadata as object) ?? {}).length ? JSON.stringify(r.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppPage>
  );
}
