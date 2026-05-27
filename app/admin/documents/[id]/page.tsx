import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { RegeneratePdfButton } from "@/components/admin/regenerate-pdf-button";

type DocType = "will" | "poa_health" | "poa_property" | "asset_list";

const DOC_TYPE_LABEL: Record<DocType, string> = {
  will: "Will",
  poa_health: "POA — Health",
  poa_property: "POA — Property",
  asset_list: "Asset list",
};

const DATA_TABLE: Record<DocType, string> = {
  will: "will_data",
  poa_health: "poa_health_data",
  poa_property: "poa_property_data",
  asset_list: "asset_list_data",
};

const DOC_STATUS_BADGE: Record<string, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  draft: { variant: "draft", label: "Draft" },
  completed: { variant: "completed", label: "Completed" },
  paid: { variant: "paid", label: "Paid" },
  generated: { variant: "new", label: "Generated" },
};

const META_COLS = new Set([
  "id", "document_id", "user_id", "current_step", "total_steps", "is_complete", "created_at", "updated_at",
]);

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

function fmtValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default async function AdminDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!doc) notFound();

  const type = doc.type as DocType;
  const userId = doc.user_id as string;
  const status = (doc.status as string) ?? "draft";
  const meta = DOC_STATUS_BADGE[status] ?? DOC_STATUS_BADGE.draft;

  const [{ data: owner }, { data: row }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
    admin
      .from(DATA_TABLE[type])
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const answers = row
    ? Object.entries(row).filter(([k, v]) => !META_COLS.has(k) && v !== null && v !== undefined)
    : [];

  return (
    <AppPage breadcrumb="Admin / Documents" title={`${DOC_TYPE_LABEL[type] ?? type}`} wide>
      <div className="mb-4">
        <Link href="/admin/documents" className="t-caption muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> All documents
        </Link>
      </div>

      <div className="stack g-4">
        <Card padded>
          <div className="row g-3" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div className="stack g-2" style={{ minWidth: 280 }}>
              <div className="row g-2" style={{ flexWrap: "wrap" }}>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                {!doc.is_current && <Badge variant="draft">Previous version</Badge>}
                <Badge variant="info">v{doc.version as number}</Badge>
              </div>
              <div className="t-body">
                <strong>Owner:</strong>{" "}
                {owner ? (
                  <Link href={`/admin/users/${owner.id}`}>{owner.full_name || owner.email}</Link>
                ) : (
                  <span className="muted">{userId}</span>
                )}
                {owner?.full_name && <span className="t-caption muted"> · {owner.email}</span>}
              </div>
              <div className="t-body"><strong>Province:</strong> {(doc.province as string) || "—"}</div>
              <div className="t-caption muted">
                Created {fmtDate(doc.created_at as string)} · Updated {fmtDate(doc.updated_at as string)}
              </div>
              <div className="t-caption muted">PDF last generated: {fmtDate(doc.pdf_generated_at as string | null)}</div>
            </div>
            <div className="row g-2" style={{ flexWrap: "wrap" }}>
              {doc.pdf_url && (
                <a href={doc.pdf_url as string} target="_blank" rel="noreferrer" className="btn btn-outline">
                  <ExternalLink size={16} style={{ marginRight: 6 }} /> Open PDF
                </a>
              )}
              <RegeneratePdfButton documentId={id} />
            </div>
          </div>
        </Card>

        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 12 }}>Answers ({DATA_TABLE[type]})</h3>
          {!row ? (
            <div className="t-body-sm muted">No data row exists for this document.</div>
          ) : answers.length === 0 ? (
            <div className="t-body-sm muted">No answers saved yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {answers.map(([k, v]) => (
                    <tr key={k} style={{ borderTop: "1px solid var(--border)", verticalAlign: "top" }}>
                      <td className="t-caption" style={{ padding: "8px 12px", width: 240, color: "var(--muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                        {k}
                      </td>
                      <td className="t-body-sm" style={{ padding: "8px 12px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {fmtValue(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
