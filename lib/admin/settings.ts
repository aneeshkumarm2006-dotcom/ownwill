import { createAdminClient } from "@/lib/supabase/admin";

export const SETTING_KEYS = ["support_email", "legal_disclaimer", "maintenance_mode"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export interface SettingsMap {
  support_email: string;
  legal_disclaimer: string;
  maintenance_mode: boolean;
}

export const SETTING_DEFAULTS: SettingsMap = {
  support_email: "support@ownwill.ca",
  legal_disclaimer:
    "OwnWill is not a law firm and does not provide legal advice. Documents generated through this service are templates only.",
  maintenance_mode: false,
};

/** Loads all settings as a typed map. Falls back to defaults for missing keys. */
export async function loadSettings(): Promise<SettingsMap> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_settings").select("key, value").in("key", [...SETTING_KEYS]);
  const out = { ...SETTING_DEFAULTS };
  for (const row of data ?? []) {
    const k = row.key as SettingKey;
    if (!SETTING_KEYS.includes(k)) continue;
    // value is stored as jsonb scalar; cast directly.
    (out as Record<string, unknown>)[k] = row.value as unknown;
  }
  return out;
}
