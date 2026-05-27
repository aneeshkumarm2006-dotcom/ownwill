import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import {
  DOC_TYPES,
  DOC_TYPE_LABEL,
  PROVINCE_CODES,
  PROVINCE_LABEL,
  STATUS_LABEL,
  type DocType,
  type ProvinceCode,
  type TemplateStatus,
} from "@/lib/admin/templates";

const STATUS_BADGE: Record<TemplateStatus, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  draft: { variant: "draft", label: STATUS_LABEL.draft },
  in_review: { variant: "new", label: STATUS_LABEL.in_review },
  approved: { variant: "completed", label: STATUS_LABEL.approved },
  retired: { variant: "draft", label: STATUS_LABEL.retired },
};

interface CellState {
  activeVersion: string | null;
  activeStatus: TemplateStatus | null;
  draftCount: number;
  inReviewCount: number;
}

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("document_template_versions")
    .select("type, province, version, status, is_active");

  // Build a (type, province) -> state map.
  const cells = new Map<string, CellState>();
  for (const t of DOC_TYPES) {
    for (const p of PROVINCE_CODES) {
      cells.set(`${t}|${p}`, {
        activeVersion: null,
        activeStatus: null,
        draftCount: 0,
        inReviewCount: 0,
      });
    }
  }
  for (const r of rows ?? []) {
    const key = `${r.type}|${r.province}`;
    const cell = cells.get(key);
    if (!cell) continue;
    if (r.is_active) {
      cell.activeVersion = r.version as string;
      cell.activeStatus = r.status as TemplateStatus;
    }
    if (r.status === "draft") cell.draftCount += 1;
    if (r.status === "in_review") cell.inReviewCount += 1;
  }

  return (
    <AppPage breadcrumb="Admin" title="Templates" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Legal templates versioned per document type × province. Active version is what the renderer pulls
        once content migration ships. Currently the live renderer still uses hardcoded copy.
      </p>

      <div className="stack g-4">
        {DOC_TYPES.map((type: DocType) => (
          <Card key={type} padded={false}>
            <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
              <h3 className="t-h4" style={{ margin: 0 }}>{DOC_TYPE_LABEL[type]}</h3>
              <span className="t-caption muted">
                {PROVINCE_CODES.length} provinces
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Province</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Active version</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Pipeline</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {PROVINCE_CODES.map((p: ProvinceCode) => {
                    const cell = cells.get(`${type}|${p}`)!;
                    const meta = cell.activeStatus ? STATUS_BADGE[cell.activeStatus] : null;
                    return (
                      <tr key={p} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="t-body-sm" style={{ padding: 12 }}>
                          <strong>{p}</strong> <span className="muted">— {PROVINCE_LABEL[p]}</span>
                        </td>
                        <td className="t-body-sm" style={{ padding: 12 }}>
                          {cell.activeVersion ?? <span className="muted">—</span>}
                        </td>
                        <td style={{ padding: 12 }}>
                          {meta ? <Badge variant={meta.variant}>{meta.label}</Badge> : <span className="t-caption muted">No active</span>}
                        </td>
                        <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                          {cell.draftCount > 0 && <span style={{ marginRight: 8 }}>{cell.draftCount} draft</span>}
                          {cell.inReviewCount > 0 && <span>{cell.inReviewCount} in review</span>}
                          {cell.draftCount === 0 && cell.inReviewCount === 0 && <span className="muted">—</span>}
                        </td>
                        <td style={{ padding: 12 }}>
                          <Link href={`/admin/templates/${type}/${p}`} className="t-body-sm" style={{ fontWeight: 600 }}>
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </AppPage>
  );
}
