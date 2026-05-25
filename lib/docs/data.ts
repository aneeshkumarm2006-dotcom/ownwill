import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns that are metadata, not form fields. */
const META_COLS = new Set([
  "id", "document_id", "user_id", "current_step", "total_steps", "is_complete", "created_at", "updated_at",
]);

export type DocData = Record<string, unknown>;

export interface LoadedDoc {
  documentId: string;
  dataId: string;
  data: DocData;
  currentStep: number;
}

/**
 * Generic load-or-create for a document + its `*_data` row. The form data is
 * simply the data row's columns (minus metadata), merged over `defaults` — so a
 * wizard's field keys are the table's column names. Used by POA + Asset wizards.
 */
export async function getOrCreateDoc(
  supabase: SupabaseClient,
  args: { userId: string; type: string; table: string; defaults: DocData; totalSteps: number; province?: string },
): Promise<LoadedDoc> {
  const { data: docData, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", args.userId)
    .eq("type", args.type)
    .eq("is_current", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (docErr) throw docErr;
  let doc = docData;
  if (!doc) {
    const { data, error } = await supabase
      .from("documents")
      .insert({ user_id: args.userId, type: args.type, province: args.province || null, status: "draft", is_current: true, version: 1 })
      .select()
      .single();
    if (error) throw error;
    doc = data;
  }

  const { data: rowData, error: rowErr } = await supabase
    .from(args.table)
    .select("*")
    .eq("document_id", doc.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (rowErr) throw rowErr;
  let row = rowData;
  if (!row) {
    const { data, error } = await supabase
      .from(args.table)
      .insert({ document_id: doc.id, user_id: args.userId, current_step: 1, total_steps: args.totalSteps, is_complete: false })
      .select()
      .single();
    if (error) throw error;
    row = data;
  }

  const data: DocData = { ...args.defaults };
  for (const [k, v] of Object.entries(row)) {
    if (!META_COLS.has(k) && v !== null && v !== undefined) data[k] = v;
  }

  return { documentId: doc.id as string, dataId: row.id as string, data, currentStep: (row.current_step as number) ?? 1 };
}

export async function saveDoc(
  supabase: SupabaseClient,
  args: { table: string; dataId: string; documentId: string; data: DocData; currentStep: number; totalSteps: number; isComplete: boolean },
): Promise<void> {
  const { error } = await supabase
    .from(args.table)
    .update({ ...args.data, current_step: args.currentStep, total_steps: args.totalSteps, is_complete: args.isComplete })
    .eq("id", args.dataId);
  if (error) throw error;

  if (args.isComplete) {
    // POA + Asset List are included with Premium (no separate payment), so
    // finishing the wizard makes the document ready to view/download.
    const now = new Date().toISOString();
    await supabase
      .from("documents")
      .update({ status: "generated", completed_at: now, pdf_generated_at: now })
      .eq("id", args.documentId);
  }
}

/** Read-only load of a document's data row (no create). Returns column map or null. */
export async function loadDoc(
  supabase: SupabaseClient,
  args: { userId: string; type: string; table: string },
): Promise<DocData | null> {
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", args.userId)
    .eq("type", args.type)
    .eq("is_current", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!doc) return null;

  const { data: row } = await supabase
    .from(args.table)
    .select("*")
    .eq("document_id", doc.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!row) return null;

  const data: DocData = {};
  for (const [k, v] of Object.entries(row)) {
    if (!META_COLS.has(k) && v !== null && v !== undefined) data[k] = v;
  }
  return data;
}
