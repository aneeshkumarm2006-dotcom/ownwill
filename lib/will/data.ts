import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emptyPerson,
  TOTAL_WILL_STEPS,
  type Person,
  type WillForm,
} from "@/types/will";
import type { Province } from "@/types";

/**
 * IMPORTANT — column-name assumptions.
 *
 * The flat person fields below (executor_*, child_guardian_*, etc.) are mapped
 * to assumed will_data column names. Reconcile these with the real schema once
 * you generate Supabase types (`npx supabase gen types ...`). If a column name
 * differs, change it here — this is the single place the mapping lives.
 */

export function defaultWillForm(): WillForm {
  return {
    full_legal_name: "",
    date_of_birth: "",
    province: "",
    city: "",
    marital_status: "",
    executor: emptyPerson(),
    backup_executor: emptyPerson(),
    beneficiaries: [],
    children: [],
    guardian: emptyPerson(),
    backup_guardian: emptyPerson(),
    pets: [],
    pet_guardian: emptyPerson(),
    pet_care_fund: null,
    specific_gifts: [],
    charitable_donations: [],
    funeral_wishes: "",
    business_interests: "",
  };
}

type Row = Record<string, unknown>;

function personToRow(prefix: string, p: Person): Row {
  return {
    [`${prefix}_first_name`]: p.first_name || null,
    [`${prefix}_last_name`]: p.last_name || null,
    [`${prefix}_relationship`]: p.relationship || null,
    [`${prefix}_email`]: p.email || null,
    [`${prefix}_phone`]: p.phone || null,
    [`${prefix}_city`]: p.city || null,
    [`${prefix}_province`]: p.province || null,
  };
}

function personFromRow(prefix: string, row: Row): Person {
  const s = (k: string) => (row[`${prefix}_${k}`] as string | null) ?? "";
  return {
    first_name: s("first_name"),
    last_name: s("last_name"),
    relationship: s("relationship"),
    email: s("email"),
    phone: s("phone"),
    city: s("city"),
    province: s("province") as Person["province"],
  };
}

function toRow(form: WillForm): Row {
  return {
    full_legal_name: form.full_legal_name || null,
    date_of_birth: form.date_of_birth || null,
    province: form.province || null,
    city: form.city || null,
    marital_status: form.marital_status || null,
    ...personToRow("executor", form.executor),
    ...personToRow("backup_executor", form.backup_executor),
    beneficiaries: form.beneficiaries,
    children: form.children,
    ...personToRow("child_guardian", form.guardian),
    ...personToRow("backup_guardian", form.backup_guardian),
    pets: form.pets,
    ...personToRow("pet_guardian", form.pet_guardian),
    pet_care_fund: form.pet_care_fund,
    specific_gifts: form.specific_gifts,
    charitable_donations: form.charitable_donations,
    funeral_wishes: form.funeral_wishes || null,
    business_interests: form.business_interests || null,
  };
}

function fromRow(row: Row): WillForm {
  const arr = <T,>(k: string): T[] => (Array.isArray(row[k]) ? (row[k] as T[]) : []);
  return {
    full_legal_name: (row.full_legal_name as string) ?? "",
    date_of_birth: (row.date_of_birth as string) ?? "",
    province: (row.province as WillForm["province"]) ?? "",
    city: (row.city as string) ?? "",
    marital_status: (row.marital_status as WillForm["marital_status"]) ?? "",
    executor: personFromRow("executor", row),
    backup_executor: personFromRow("backup_executor", row),
    beneficiaries: arr("beneficiaries"),
    children: arr("children"),
    guardian: personFromRow("child_guardian", row),
    backup_guardian: personFromRow("backup_guardian", row),
    pets: arr("pets"),
    pet_guardian: personFromRow("pet_guardian", row),
    pet_care_fund: (row.pet_care_fund as number | null) ?? null,
    specific_gifts: arr("specific_gifts"),
    charitable_donations: arr("charitable_donations"),
    funeral_wishes: (row.funeral_wishes as string) ?? "",
    business_interests: (row.business_interests as string) ?? "",
  };
}

export interface LoadedWill {
  documentId: string;
  willDataId: string;
  form: WillForm;
  currentStep: number;
}

/**
 * Finds the user's current will document + will_data row, creating them if they
 * don't exist yet. Returns the hydrated form and the step to resume from.
 */
export async function getOrCreateWill(
  supabase: SupabaseClient,
  userId: string,
  province?: Province | "",
): Promise<LoadedWill> {
  const { data: docData, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "will")
    .eq("is_current", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (docErr) throw docErr;
  let doc = docData;

  if (!doc) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        type: "will",
        province: province || null,
        status: "draft",
        is_current: true,
        version: 1,
      })
      .select()
      .single();
    if (error) throw error;
    doc = data;
  }

  const { data: wdData, error: wdErr } = await supabase
    .from("will_data")
    .select("*")
    .eq("document_id", doc.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (wdErr) throw wdErr;
  let wd = wdData;

  if (!wd) {
    const { data, error } = await supabase
      .from("will_data")
      .insert({
        document_id: doc.id,
        user_id: userId,
        current_step: 1,
        total_steps: TOTAL_WILL_STEPS,
        is_complete: false,
      })
      .select()
      .single();
    if (error) throw error;
    wd = data;
  }

  return {
    documentId: doc.id as string,
    willDataId: wd.id as string,
    form: fromRow(wd as Row),
    currentStep: (wd.current_step as number) ?? 1,
  };
}

/** Persists the current answers + step. Marks the document completed when done. */
export async function saveWill(
  supabase: SupabaseClient,
  args: {
    willDataId: string;
    documentId: string;
    form: WillForm;
    currentStep: number;
    isComplete: boolean;
  },
): Promise<void> {
  const { error } = await supabase
    .from("will_data")
    .update({
      ...toRow(args.form),
      current_step: args.currentStep,
      total_steps: TOTAL_WILL_STEPS,
      is_complete: args.isComplete,
    })
    .eq("id", args.willDataId);
  if (error) throw error;

  if (args.isComplete) {
    const { error: docErr } = await supabase
      .from("documents")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", args.documentId);
    if (docErr) throw docErr;
  }
}
