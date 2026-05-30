import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateWill } from "@/lib/will/data";
import { loadDoc } from "@/lib/docs/data";
import { renderDocument, DOCUMENT_CSS } from "@/lib/docs/document";
import { renderPdf, PdfTimeoutError } from "@/lib/pdf/render";
import { rateLimit } from "@/lib/rate-limit";
import { PdfRequestSchema, type DocumentTypeValue } from "@/lib/validation/api";
import { apiOk, apiError } from "@/lib/api/response";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const RATE_LIMIT_PER_USER = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const TABLE: Record<Exclude<DocumentTypeValue, "will">, string> = {
  poa_health: "poa_health_data",
  poa_property: "poa_property_data",
  asset_list: "asset_list_data",
};

/**
 * Generates a document PDF (any type) from the user's answers, uploads it to
 * Supabase Storage (bucket: documents), records pdf_url, and returns the URL.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiError("Unauthorized", 401);

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return apiError("Payload too large", 413);
  }

  const limit = rateLimit(`pdf:${user.id}`, RATE_LIMIT_PER_USER, RATE_WINDOW_MS);
  if (!limit.ok) {
    return apiError("Too many requests. Try again later.", 429, {
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    // no body → default to will
  }
  const parsed = PdfRequestSchema.safeParse(raw);
  if (!parsed.success) return apiError("Unknown document type", 400);
  const type: DocumentTypeValue = parsed.data.type ?? "will";

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const ownerName = (profile?.full_name as string) ?? (user.user_metadata?.full_name as string) ?? "";

  let documentId: string;
  let html: string;

  if (type === "will") {
    const w = await getOrCreateWill(supabase, user.id);
    documentId = w.documentId;
    html = renderDocument("will", w.form, ownerName);
  } else {
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!doc) return apiError("This document hasn't been started yet.", 400);
    documentId = doc.id as string;
    const data = await loadDoc(supabase, { userId: user.id, type, table: TABLE[type] });
    html = renderDocument(type, data ?? {}, ownerName);
  }

  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${DOCUMENT_CSS}</style></head><body>${html}</body></html>`;

  let pdf: Buffer;
  try {
    pdf = await renderPdf(fullHtml);
  } catch (e) {
    if (e instanceof PdfTimeoutError) {
      return apiError(
        "Generating your PDF is taking longer than expected. Please try again, or use the print view in the meantime.",
        504,
      );
    }
    return apiError(
      `PDF engine failed: ${e instanceof Error ? e.message : "unknown"}. Use the print view instead.`,
      500,
    );
  }

  const admin = createAdminClient();
  const path = `${user.id}/${type}-${documentId}.pdf`;
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) return apiError(upErr.message, 500);

  const { data: pub } = admin.storage.from("documents").getPublicUrl(path);
  await admin
    .from("documents")
    .update({ pdf_url: pub.publicUrl, pdf_generated_at: new Date().toISOString(), status: "generated" })
    .eq("id", documentId);

  // Pro webhook fan-out for "we just rendered a fresh PDF" — useful for firms
  // that want to push the artifact into their own document store.
  void (async () => {
    try {
      const { fireDocumentEvent } = await import("@/lib/pro/webhooks");
      await fireDocumentEvent({ type: "document.generated", documentId });
    } catch (e) {
      console.error("[webhook] pdf.generated dispatch failed", e);
    }
  })();

  return apiOk({ url: pub.publicUrl });
}
