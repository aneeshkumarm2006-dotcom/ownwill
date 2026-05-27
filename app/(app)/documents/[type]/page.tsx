import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWill } from "@/lib/will/data";
import { loadDoc } from "@/lib/docs/data";
import { renderDocument, DOCUMENT_CSS, DOCUMENT_TITLES } from "@/lib/docs/document";
import { PrintButton } from "@/components/will/print-button";
import { DownloadPdfButton } from "@/components/will/download-pdf-button";
import type { DocumentType } from "@/types";

const TABLE: Record<Exclude<DocumentType, "will">, string> = {
  poa_health: "poa_health_data",
  poa_property: "poa_property_data",
  asset_list: "asset_list_data",
};

function isDocumentType(value: string): value is DocumentType {
  return value in DOCUMENT_TITLES;
}

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  if (!isDocumentType(rawType)) notFound();
  const type: DocumentType = rawType;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
  const ownerName = (profile?.full_name as string) ?? (user?.user_metadata?.full_name as string) ?? "";

  let html: string;
  if (type === "will") {
    const { form } = await getOrCreateWill(supabase, user!.id);
    html = renderDocument("will", form, ownerName);
  } else {
    const data = await loadDoc(supabase, { userId: user!.id, type, table: TABLE[type] });
    html = renderDocument(type, data ?? {}, ownerName);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="row" style={{ justifyContent: "space-between", padding: "12px 24px", maxWidth: 980, margin: "0 auto" }}>
          <Link href="/documents" className="row g-2 link" style={{ textDecoration: "none" }}>
            <ArrowLeft size={16} /> Back to documents
          </Link>
          <div className="row g-2">
            <PrintButton />
            <DownloadPdfButton type={type} />
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: DOCUMENT_CSS }} />
      <div style={{ padding: "32px 16px" }}>
        <div className="card" style={{ maxWidth: 840, margin: "0 auto", padding: 56 }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
