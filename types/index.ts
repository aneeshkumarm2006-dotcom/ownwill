// Domain types shared across the app. These mirror the Supabase schema
// documented in CLAUDE.md. Generated DB types live in `types/database.ts`.

export const PROVINCES = [
  "ON",
  "BC",
  "AB",
  "MB",
  "NB",
  "NL",
  "NS",
  "PE",
  "SK",
  "QC",
] as const;
export type Province = (typeof PROVINCES)[number];

export const PROVINCE_NAMES: Record<Province, string> = {
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  PE: "Prince Edward Island",
  SK: "Saskatchewan",
  QC: "Quebec",
};

export const PROVINCE_OPTIONS = PROVINCES.map((code) => ({
  value: code,
  label: PROVINCE_NAMES[code],
}));

export type Plan = "none" | "essentials" | "premium" | "premium_x2";

export type DocumentType = "will" | "poa_health" | "poa_property" | "asset_list";

export type DocumentStatus = "draft" | "completed" | "paid" | "generated";

export const PLAN_PRICES: Record<Exclude<Plan, "none">, number> = {
  essentials: 129,
  premium: 199,
  premium_x2: 349,
};
