import { z } from "zod";

// JSONB items stored on will_data. Schemas mirror the TypeScript shapes in
// `@/types/will`; missing fields are filled with defaults so partial rows from
// older drafts still hydrate cleanly. Used by `fromRow` in lib/will/data.ts to
// replace bare `Array.isArray` casts with a per-item type-guard.

const genId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const idField = z.string().default(genId);

export const BeneficiarySchema = z.object({
  _id: idField,
  name: z.string().default(""),
  relationship: z.string().default(""),
  percentage: z.coerce.number().default(0),
  dob: z.string().default(""),
});

export const ChildSchema = z.object({
  _id: idField,
  name: z.string().default(""),
  dob: z.string().default(""),
});

export const PetSchema = z.object({
  _id: idField,
  name: z.string().default(""),
  type: z.string().default(""),
  breed: z.string().default(""),
});

export const SpecificGiftSchema = z.object({
  _id: idField,
  item: z.string().default(""),
  recipient_name: z.string().default(""),
  recipient_relationship: z.string().default(""),
});

export const CharitableDonationSchema = z.object({
  _id: idField,
  organization: z.string().default(""),
  amount: z.coerce.number().default(0),
  is_percentage: z.boolean().default(false),
});

// Returns a function that parses a single unknown value into T, dropping
// rows that don't match. Used to filter raw JSONB arrays without throwing on
// legacy drafts that may have extra/missing keys.
function arrayOf<T extends z.ZodTypeAny>(item: T) {
  return (value: unknown): z.infer<T>[] => {
    if (!Array.isArray(value)) return [];
    const out: z.infer<T>[] = [];
    for (const raw of value) {
      const parsed = item.safeParse(raw);
      if (parsed.success) out.push(parsed.data);
    }
    return out;
  };
}

export const parseBeneficiaries = arrayOf(BeneficiarySchema);
export const parseChildren = arrayOf(ChildSchema);
export const parsePets = arrayOf(PetSchema);
export const parseSpecificGifts = arrayOf(SpecificGiftSchema);
export const parseCharitableDonations = arrayOf(CharitableDonationSchema);
