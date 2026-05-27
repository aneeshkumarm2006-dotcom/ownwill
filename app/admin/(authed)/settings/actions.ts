"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { SETTING_KEYS, type SettingKey } from "@/lib/admin/settings";

type Result = { error: string | null };
function err(message: string): Result { return { error: message }; }
function ok(): Result { return { error: null }; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(key: SettingKey, value: unknown): string | null {
  switch (key) {
    case "support_email":
      if (typeof value !== "string" || !EMAIL_RE.test(value)) return "Must be a valid email.";
      return null;
    case "legal_disclaimer":
      if (typeof value !== "string") return "Must be text.";
      if (value.length > 4000) return "Disclaimer is too long (max 4000 chars).";
      return null;
    case "maintenance_mode":
      if (typeof value !== "boolean") return "Must be true or false.";
      return null;
  }
}

/** Update a single setting. Validated per-key. Audit-logged. */
export async function updateSetting(args: { key: SettingKey; value: unknown }): Promise<Result> {
  const actor = await requireAdmin();
  if (!SETTING_KEYS.includes(args.key)) return err("Unknown setting.");

  const invalid = validate(args.key, args.value);
  if (invalid) return err(invalid);

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .upsert({
      key: args.key,
      value: args.value,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    });
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "settings.update",
    targetType: "setting", targetId: args.key,
    metadata: { value: args.value },
  });

  revalidatePath("/admin/settings");
  return ok();
}
