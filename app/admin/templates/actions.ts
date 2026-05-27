"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import {
  isDocType,
  isProvinceCode,
  type DocType,
  type ProvinceCode,
} from "@/lib/admin/templates";

type Result = { error: string | null; id?: string };
function err(message: string): Result { return { error: message }; }
function ok(id?: string): Result { return { error: null, id }; }

interface VersionRow {
  id: string;
  type: DocType;
  province: ProvinceCode;
  version: string;
  status: "draft" | "in_review" | "approved" | "retired";
  body: string;
  change_notes: string | null;
  is_active: boolean;
}

/** Picks the next "vN" string after the highest existing version for (type, province). */
function nextVersionString(existing: string[]): string {
  let maxN = 0;
  for (const v of existing) {
    const m = /^v(\d+)$/i.exec(v);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  return `v${maxN + 1}`;
}

/** Creates a new draft version. If a prior version exists, seeds body from the latest. */
export async function createVersion(args: {
  type: DocType;
  province: ProvinceCode;
  changeNotes?: string;
}): Promise<Result> {
  const actor = await requireAdmin();
  if (!isDocType(args.type)) return err("Invalid document type.");
  if (!isProvinceCode(args.province)) return err("Invalid province.");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("document_template_versions")
    .select("version, body")
    .eq("type", args.type)
    .eq("province", args.province)
    .order("created_at", { ascending: false });

  const version = nextVersionString((existing ?? []).map((r) => r.version as string));
  const seedBody = (existing?.[0]?.body as string) ?? "";

  const { data: inserted, error } = await admin
    .from("document_template_versions")
    .insert({
      type: args.type,
      province: args.province,
      version,
      status: "draft",
      body: seedBody,
      change_notes: args.changeNotes ?? null,
      created_by: actor.id,
    })
    .select("id")
    .single();
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.create_version",
    targetType: "template", targetId: inserted.id as string,
    metadata: { type: args.type, province: args.province, version },
  });

  revalidatePath(`/admin/templates/${args.type}/${args.province}`);
  revalidatePath("/admin/templates");
  return ok(inserted.id as string);
}

async function fetchVersion(id: string): Promise<VersionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("document_template_versions")
    .select("id, type, province, version, status, body, change_notes, is_active")
    .eq("id", id)
    .maybeSingle();
  return (data as VersionRow | null) ?? null;
}

/** Edit body / change_notes. Only allowed while status='draft'. */
export async function updateVersion(args: {
  id: string;
  body: string;
  changeNotes: string;
}): Promise<Result> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const cur = await fetchVersion(args.id);
  if (!cur) return err("Version not found.");
  if (cur.status !== "draft") return err("Only drafts can be edited. Create a new version instead.");

  const { error } = await admin
    .from("document_template_versions")
    .update({
      body: args.body,
      change_notes: args.changeNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.update_version",
    targetType: "template", targetId: args.id,
    metadata: { type: cur.type, province: cur.province, version: cur.version },
  });

  revalidatePath(`/admin/templates/${cur.type}/${cur.province}`);
  return ok();
}

/** Send a draft for lawyer review. */
export async function submitForReview(id: string): Promise<Result> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const cur = await fetchVersion(id);
  if (!cur) return err("Version not found.");
  if (cur.status !== "draft") return err("Only drafts can be submitted.");
  if (!cur.body.trim()) return err("Cannot submit an empty body.");

  const { error } = await admin
    .from("document_template_versions")
    .update({ status: "in_review", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.submit_review",
    targetType: "template", targetId: id,
    metadata: { type: cur.type, province: cur.province, version: cur.version },
  });

  revalidatePath(`/admin/templates/${cur.type}/${cur.province}`);
  return ok();
}

/** Lawyer (or admin) marks an in-review version approved. */
export async function approveVersion(id: string): Promise<Result> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const cur = await fetchVersion(id);
  if (!cur) return err("Version not found.");
  if (cur.status !== "in_review") return err("Only in-review versions can be approved.");

  const { error } = await admin
    .from("document_template_versions")
    .update({
      status: "approved",
      approved_by: actor.id,
      approved_by_email: actor.email,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.approve",
    targetType: "template", targetId: id,
    metadata: { type: cur.type, province: cur.province, version: cur.version },
  });

  revalidatePath(`/admin/templates/${cur.type}/${cur.province}`);
  revalidatePath("/admin/templates");
  return ok();
}

/** Move approved version → active. Deactivates any prior active for same (type, province). */
export async function activateVersion(id: string): Promise<Result> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const cur = await fetchVersion(id);
  if (!cur) return err("Version not found.");
  if (cur.status !== "approved") return err("Only approved versions can be activated.");
  if (cur.is_active) return err("Already active.");

  // Two-step to avoid violating the partial-unique-active index transiently.
  const { error: deactErr } = await admin
    .from("document_template_versions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("type", cur.type)
    .eq("province", cur.province)
    .eq("is_active", true);
  if (deactErr) return err(deactErr.message);

  const { error } = await admin
    .from("document_template_versions")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.activate",
    targetType: "template", targetId: id,
    metadata: { type: cur.type, province: cur.province, version: cur.version },
  });

  revalidatePath(`/admin/templates/${cur.type}/${cur.province}`);
  revalidatePath("/admin/templates");
  return ok();
}

/** Retire an approved version. Cannot retire the currently active one. */
export async function retireVersion(id: string): Promise<Result> {
  const actor = await requireAdmin();
  const admin = createAdminClient();

  const cur = await fetchVersion(id);
  if (!cur) return err("Version not found.");
  if (cur.status !== "approved") return err("Only approved versions can be retired.");
  if (cur.is_active) return err("Deactivate first by activating another version.");

  const { error } = await admin
    .from("document_template_versions")
    .update({ status: "retired", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "template.retire",
    targetType: "template", targetId: id,
    metadata: { type: cur.type, province: cur.province, version: cur.version },
  });

  revalidatePath(`/admin/templates/${cur.type}/${cur.province}`);
  return ok();
}
