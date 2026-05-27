"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { renderDocument, DOCUMENT_CSS } from "@/lib/docs/document";
import { renderPdf, PdfTimeoutError } from "@/lib/pdf/render";
import { fromRow } from "@/lib/will/data";

type DocType = "will" | "poa_health" | "poa_property" | "asset_list";

const DATA_TABLE: Record<DocType, string> = {
  will: "will_data",
  poa_health: "poa_health_data",
  poa_property: "poa_property_data",
  asset_list: "asset_list_data",
};

const META_COLS = new Set([
  "id", "document_id", "user_id", "current_step", "total_steps", "is_complete", "created_at", "updated_at",
]);

function err(message: string) { return { error: message, url: null as string | null }; }

/** Admin regenerates a document's PDF from current answers. Audit-logged. */
export async function regeneratePdf(documentId: string): Promise<{ error: string | null; url: string | null }> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, user_id, type")
    .eq("id", documentId)
    .maybeSingle();
  if (docErr) return err(docErr.message);
  if (!doc) return err("Document not found.");

  const type = doc.type as DocType;
  const userId = doc.user_id as string;

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const ownerName = (profile?.full_name as string) ?? "";

  const { data: row } = await admin
    .from(DATA_TABLE[type])
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!row) return err("No answers saved for this document.");

  let formData: Record<string, unknown>;
  if (type === "will") {
    formData = fromRow(row as Record<string, unknown>) as unknown as Record<string, unknown>;
  } else {
    formData = {};
    for (const [k, v] of Object.entries(row)) {
      if (!META_COLS.has(k) && v !== null && v !== undefined) formData[k] = v;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = renderDocument(type, formData as any, ownerName);
  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${DOCUMENT_CSS}</style></head><body>${html}</body></html>`;

  let pdf: Buffer;
  try {
    pdf = await renderPdf(fullHtml);
  } catch (e) {
    if (e instanceof PdfTimeoutError) return err("PDF rendering timed out. Try again.");
    return err(`PDF engine failed: ${e instanceof Error ? e.message : "unknown"}`);
  }

  const path = `${userId}/${type}-${documentId}.pdf`;
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) return err(upErr.message);

  const { data: pub } = admin.storage.from("documents").getPublicUrl(path);
  const generatedAt = new Date().toISOString();
  await admin
    .from("documents")
    .update({ pdf_url: pub.publicUrl, pdf_generated_at: generatedAt, status: "generated" })
    .eq("id", documentId);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "document.regenerate_pdf",
    targetType: "document", targetId: documentId,
    metadata: { type, user_id: userId },
  });

  revalidatePath(`/admin/documents/${documentId}`);
  revalidatePath(`/admin/users/${userId}`);
  return { error: null, url: pub.publicUrl };
}
