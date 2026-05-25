import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateWill } from "@/lib/will/data";
import { loadDoc } from "@/lib/docs/data";
import { renderDocument, DOCUMENT_CSS, DOCUMENT_TITLES } from "@/lib/docs/document";
import { renderPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLE: Record<string, string> = {
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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let type = "will";
  try {
    const body = await req.json();
    if (body?.type) type = String(body.type);
  } catch {
    // no body → default to will
  }
  if (!DOCUMENT_TITLES[type]) return NextResponse.json({ error: "Unknown document type" }, { status: 400 });

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
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: "This document hasn't been started yet." }, { status: 400 });
    documentId = doc.id as string;
    const data = await loadDoc(supabase, { userId: user.id, type, table: TABLE[type] });
    html = renderDocument(type, data ?? {}, ownerName);
  }

  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${DOCUMENT_CSS}</style></head><body>${html}</body></html>`;

  let pdf: Buffer;
  try {
    pdf = await renderPdf(fullHtml);
  } catch (e) {
    return NextResponse.json(
      { error: `PDF engine failed: ${e instanceof Error ? e.message : "unknown"}. Use the print view instead.` },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const path = `${user.id}/${type}-${documentId}.pdf`;
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = admin.storage.from("documents").getPublicUrl(path);
  await admin
    .from("documents")
    .update({ pdf_url: pub.publicUrl, pdf_generated_at: new Date().toISOString(), status: "generated" })
    .eq("id", documentId);

  return NextResponse.json({ url: pub.publicUrl });
}
