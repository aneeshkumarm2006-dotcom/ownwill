export const DOC_TYPES = ["will", "poa_health", "poa_property", "asset_list"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  will: "Will",
  poa_health: "POA — Health",
  poa_property: "POA — Property",
  asset_list: "Asset list",
};

export const PROVINCE_CODES = ["ON", "BC", "AB", "MB", "NB", "NL", "NS", "PE", "SK", "QC"] as const;
export type ProvinceCode = (typeof PROVINCE_CODES)[number];

export const PROVINCE_LABEL: Record<ProvinceCode, string> = {
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland & Labrador",
  NS: "Nova Scotia",
  PE: "Prince Edward Island",
  SK: "Saskatchewan",
  QC: "Quebec",
};

export type TemplateStatus = "draft" | "in_review" | "approved" | "retired";

export const STATUS_LABEL: Record<TemplateStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  retired: "Retired",
};

export function isDocType(v: unknown): v is DocType {
  return typeof v === "string" && (DOC_TYPES as readonly string[]).includes(v);
}

export function isProvinceCode(v: unknown): v is ProvinceCode {
  return typeof v === "string" && (PROVINCE_CODES as readonly string[]).includes(v);
}
