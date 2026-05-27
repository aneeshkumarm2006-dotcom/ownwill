import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { TemplateEditor } from "@/components/admin/template-editor";
import { TemplateVersionActions } from "@/components/admin/template-version-actions";
import { TemplateNewVersionButton } from "@/components/admin/template-new-version-button";
import {
  DOC_TYPE_LABEL,
  PROVINCE_LABEL,
  STATUS_LABEL,
  isDocType,
  isProvinceCode,
  type TemplateStatus,
} from "@/lib/admin/templates";

const STATUS_BADGE: Record<TemplateStatus, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  draft: { variant: "draft", label: STATUS_LABEL.draft },
  in_review: { variant: "new", label: STATUS_LABEL.in_review },
  approved: { variant: "completed", label: STATUS_LABEL.approved },
  retired: { variant: "draft", label: STATUS_LABEL.retired },
};

interface VersionRow {
  id: string;
  version: string;
  status: TemplateStatus;
  body: string;
  change_notes: string | null;
  is_active: boolean;
  approved_by_email: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminTemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; province: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  await requireAdmin();
  const { type, province } = await params;
  const { v: selectedId } = await searchParams;

  if (!isDocType(type) || !isProvinceCode(province)) notFound();

  const admin = createAdminClient();
  const { data: versionsRaw } = await admin
    .from("document_template_versions")
    .select("id, version, status, body, change_notes, is_active, approved_by_email, approved_at, created_at, updated_at")
    .eq("type", type)
    .eq("province", province)
    .order("created_at", { ascending: false });

  const versions = (versionsRaw ?? []) as VersionRow[];
  const selected = selectedId
    ? versions.find((v) => v.id === selectedId)
    : (versions.find((v) => v.is_active) ?? versions[0]);

  return (
    <AppPage
      breadcrumb="Admin / Templates"
      title={`${DOC_TYPE_LABEL[type]} — ${PROVINCE_LABEL[province]}`}
      wide
    >
      <div className="mb-4">
        <Link href="/admin/templates" className="t-caption muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> All templates
        </Link>
      </div>

      <div className="stack g-4">
        <Card padded>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <div>
              <h3 className="t-h4" style={{ margin: 0 }}>Versions</h3>
              <p className="t-caption muted" style={{ margin: "4px 0 0" }}>
                {versions.length} {versions.length === 1 ? "version" : "versions"} for {type} / {province}.
              </p>
            </div>
            <TemplateNewVersionButton type={type} province={province} />
          </div>
        </Card>

        {versions.length === 0 ? (
          <Card padded>
            <div className="t-body-sm muted">
              No versions yet. Create the first draft to get started.
            </div>
          </Card>
        ) : (
          <Card padded={false}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Version</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Approved</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Updated</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => {
                    const meta = STATUS_BADGE[v.status];
                    const isSel = selected?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        style={{
                          borderTop: "1px solid var(--border)",
                          background: isSel ? "var(--muted)" : undefined,
                        }}
                      >
                        <td style={{ padding: 0 }}>
                          <Link
                            href={`/admin/templates/${type}/${province}?v=${v.id}`}
                            scroll={false}
                            style={{ display: "block", padding: 12, textDecoration: "none", color: "inherit" }}
                          >
                            <span className="t-body-sm" style={{ fontWeight: 600 }}>{v.version}</span>
                            {v.is_active && (
                              <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--success, #0E4C49)" }}>
                                <CheckCircle2 size={14} /> <span className="t-caption">Active</span>
                              </span>
                            )}
                          </Link>
                        </td>
                        <td style={{ padding: 12 }}><Badge variant={meta.variant}>{meta.label}</Badge></td>
                        <td className="t-caption" style={{ padding: 12 }}>
                          {v.approved_at ? (
                            <>
                              {fmtDate(v.approved_at)}
                              {v.approved_by_email && <div className="muted">by {v.approved_by_email}</div>}
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{fmtDate(v.updated_at)}</td>
                        <td style={{ padding: 12 }}>
                          <TemplateVersionActions id={v.id} status={v.status} isActive={v.is_active} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {selected && (
          <Card padded>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <h3 className="t-h4" style={{ margin: 0 }}>
                  {selected.version} <Badge variant={STATUS_BADGE[selected.status].variant} style={{ marginLeft: 8 }}>
                    {STATUS_BADGE[selected.status].label}
                  </Badge>
                  {selected.is_active && <Badge variant="completed" style={{ marginLeft: 4 }}>Active</Badge>}
                </h3>
                <p className="t-caption muted" style={{ margin: "4px 0 0" }}>
                  Created {fmtDate(selected.created_at)} · Updated {fmtDate(selected.updated_at)}
                </p>
              </div>
            </div>

            {selected.status === "draft" ? (
              <TemplateEditor
                id={selected.id}
                initialBody={selected.body ?? ""}
                initialChangeNotes={selected.change_notes ?? ""}
              />
            ) : (
              <div className="stack g-3">
                {selected.change_notes && (
                  <div>
                    <div className="field-label">Change notes</div>
                    <p className="t-body-sm" style={{ whiteSpace: "pre-wrap" }}>{selected.change_notes}</p>
                  </div>
                )}
                <div>
                  <div className="field-label">Body</div>
                  <pre
                    className="t-body-sm"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "var(--font-mono, monospace)",
                      background: "var(--muted)",
                      padding: 12,
                      borderRadius: 8,
                      maxHeight: 480,
                      overflowY: "auto",
                      margin: 0,
                    }}
                  >
                    {selected.body || "(empty)"}
                  </pre>
                </div>
                <p className="t-caption muted">
                  This version is {STATUS_LABEL[selected.status].toLowerCase()} and cannot be edited.
                  Create a new draft to make changes.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppPage>
  );
}
