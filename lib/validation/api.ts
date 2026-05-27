import { z } from "zod";
import { EMAIL_RE } from "@/lib/validation/email";
import type { DocumentType } from "@/types";

// Body for POST /api/email. The recipient is always forced to the signed-in
// user's email server-side, so it is not accepted from the caller.
export const EmailRequestSchema = z.object({
  subject: z.string().min(1, "Missing subject").max(200, "Subject too long"),
  html: z.string().min(1, "Missing html").max(50_000, "HTML body too large"),
});
export type EmailRequest = z.infer<typeof EmailRequestSchema>;

// A bare `z.string().email()` allow-listed against EMAIL_RE — kept here so the
// same shape can be reused if a future route accepts an explicit `to` field.
export const EmailAddress = z
  .string()
  .trim()
  .max(254)
  .refine((v) => EMAIL_RE.test(v), { message: "Invalid email" });

// Mirrors `DocumentType` in @/types. The `satisfies` keeps the two in sync at
// compile time: if a new doc type is added there, this enum must include it.
export const DocumentTypeSchema = z.enum([
  "will",
  "poa_health",
  "poa_property",
  "asset_list",
] as const satisfies readonly DocumentType[]);
export type DocumentTypeValue = z.infer<typeof DocumentTypeSchema>;

export const PdfRequestSchema = z.object({
  type: DocumentTypeSchema.optional(),
});
