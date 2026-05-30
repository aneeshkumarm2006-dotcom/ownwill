import Link from "next/link";
import { requirePro } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

export const metadata = { title: "Audit log — OwnWill Pro" };

const PAGE_SIZE = 50;

/**
 * Org-scoped audit trail for the firm owner/admins. We filter the global
 * `admin_audit_log` to actions whose `pro.*` action prefix touches this org —
 * either via `target_id = organizationId` for org-level events, or via
 * `metadata->>organization_id` for events targeted at a user (client view/edit,
 * client revoke) where the target is the user.
 *
 * Service-role read because admin_audit_log is RLS-locked; we layer
 * org-scoping in this query to make sure one firm can never see another's
 * trail.
 */
export default async function ProAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  const actor = await requirePro();
  const { action, actor: actorFilter } = await searchParams;

  const admin = createAdminClient();

  // Two passes because Supabase doesn't compose a clean OR across a literal
  // column match (`target_id`) and a JSONB key (`metadata->>organization_id`).
  // We pull both sets, merge, sort, and slice — total volume is bounded by
  // the org's own activity so this stays cheap.
  let qOrg = admin
    .from("admin_audit_log")
    .select(
      "id, actor_id, actor_email, action, target_type, target_id, metadata, created_at",
    )
    .eq("target_id", actor.organizationId)
    .like("action", "pro.%")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  let qMeta = admin
    .from("admin_audit_log")
    .select(
      "id, actor_id, actor_email, action, target_type, target_id, metadata, created_at",
    )
    .eq("metadata->>organization_id", actor.organizationId)
    .like("action", "pro.%")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (action) {
    qOrg = qOrg.eq("action", action);
    qMeta = qMeta.eq("action", action);
  }
  if (actorFilter) {
    qOrg = qOrg.ilike("actor_email", `%${actorFilter}%`);
    qMeta = qMeta.ilike("actor_email", `%${actorFilter}%`);
  }

  const [{ data: orgRows }, { data: metaRows }] = await Promise.all([qOrg, qMeta]);

  // Dedupe by row id (the two queries can overlap when an action targets the
  // org row *and* stamps organization_id into metadata) and keep newest first.
  const seen = new Set<string>();
  const rows = [...(orgRows ?? []), ...(metaRows ?? [])]
    .filter((r) => {
      const id = r.id as string;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    )
    .slice(0, PAGE_SIZE);

  return (
    <AppPage breadcrumb="Pro" title="Audit log" wide>
      <p
        className="t-body muted"
        style={{ marginTop: -8, marginBottom: 16 }}
      >
        Append-only record of every action your team has taken on this firm.
        Showing the most recent {PAGE_SIZE}.
      </p>

      <Card padded={false} style={{ marginBottom: 16 }}>
        <form
          method="get"
          className="row g-2"
          style={{ padding: 12, flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <label className="stack g-1" style={{ flex: "1 1 220px" }}>
            <span className="t-caption muted">Filter by action</span>
            <input
              name="action"
              defaultValue={action ?? ""}
              placeholder="e.g. pro.client.invite"
              className="t-body-sm"
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--background)",
              }}
            />
          </label>
          <label className="stack g-1" style={{ flex: "1 1 220px" }}>
            <span className="t-caption muted">Filter by actor email</span>
            <input
              name="actor"
              defaultValue={actorFilter ?? ""}
              placeholder="e.g. jane@firm.ca"
              className="t-body-sm"
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--background)",
              }}
            />
          </label>
          <button
            type="submit"
            className="t-body-sm"
            style={{
              padding: "8px 14px",
              border: "1px solid var(--primary)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          {(action || actorFilter) && (
            <Link
              href="/pro/audit"
              className="t-body-sm"
              style={{ alignSelf: "center" }}
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>
            No matching events yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}
            >
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>When</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Actor</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Action</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Target</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                      {new Date(r.created_at as string).toLocaleString("en-CA")}
                    </td>
                    <td className="t-body-sm" style={{ padding: 12 }}>
                      {(r.actor_email as string) ?? "—"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <Badge variant="info">{r.action as string}</Badge>
                    </td>
                    <td className="t-body-sm" style={{ padding: 12 }}>
                      {r.target_type ? <span className="muted">{r.target_type as string}</span> : "—"}
                      {r.target_id ? (
                        <code style={{ marginLeft: 6, fontSize: 12 }}>
                          {(r.target_id as string).slice(0, 8)}
                        </code>
                      ) : null}
                    </td>
                    <td
                      className="t-caption"
                      style={{
                        padding: 12,
                        color: "var(--muted-foreground)",
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Object.keys((r.metadata as object) ?? {}).length
                        ? JSON.stringify(r.metadata)
                        : "—"}
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
