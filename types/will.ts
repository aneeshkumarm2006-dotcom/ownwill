import type { Province } from "@/types";

export type MaritalStatus =
  | "single"
  | "married"
  | "common_law"
  | "divorced"
  | "widowed";

export const MARITAL_STATUSES: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "common_law", label: "Common-law" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

/** A named person (executor, guardian, etc.) stored as flat columns in will_data. */
export interface Person {
  first_name: string;
  last_name: string;
  relationship: string;
  email: string;
  phone: string;
  city: string;
  province: Province | "";
}

export const emptyPerson = (): Person => ({
  first_name: "",
  last_name: "",
  relationship: "",
  email: "",
  phone: "",
  city: "",
  province: "",
});

export const personName = (p: Person): string =>
  [p.first_name, p.last_name].filter(Boolean).join(" ").trim();

export const hasPerson = (p: Person): boolean =>
  Boolean(p.first_name || p.last_name);

// --- Repeating items (stored as JSONB arrays) ---

export interface Beneficiary {
  name: string;
  relationship: string;
  percentage: number;
  dob: string;
}
export const emptyBeneficiary = (): Beneficiary => ({
  name: "",
  relationship: "",
  percentage: 0,
  dob: "",
});

export interface Child {
  name: string;
  dob: string;
}
export const emptyChild = (): Child => ({ name: "", dob: "" });

export interface Pet {
  name: string;
  type: string;
  breed: string;
}
export const emptyPet = (): Pet => ({ name: "", type: "", breed: "" });

export interface SpecificGift {
  item: string;
  recipient_name: string;
  recipient_relationship: string;
}
export const emptyGift = (): SpecificGift => ({
  item: "",
  recipient_name: "",
  recipient_relationship: "",
});

export interface CharitableDonation {
  organization: string;
  amount: number;
  is_percentage: boolean;
}
export const emptyDonation = (): CharitableDonation => ({
  organization: "",
  amount: 0,
  is_percentage: false,
});

/** The full set of will answers held in the wizard. */
export interface WillForm {
  // Personal
  full_legal_name: string;
  date_of_birth: string;
  province: Province | "";
  city: string;
  marital_status: MaritalStatus | "";
  // Executor
  executor: Person;
  backup_executor: Person;
  // Beneficiaries
  beneficiaries: Beneficiary[];
  // Children + guardians
  children: Child[];
  guardian: Person;
  backup_guardian: Person;
  // Pets
  pets: Pet[];
  pet_guardian: Person;
  pet_care_fund: number | null;
  // Gifts + donations
  specific_gifts: SpecificGift[];
  charitable_donations: CharitableDonation[];
  // Wishes
  funeral_wishes: string;
  business_interests: string;
}

/** True if the person was born less than 18 years ago. */
export function isMinor(dob: string): boolean {
  if (!dob) return false;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 18;
}

export const hasMinorChild = (children: Child[]): boolean =>
  children.some((c) => isMinor(c.dob));

export const beneficiaryTotal = (beneficiaries: Beneficiary[]): number =>
  beneficiaries.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);

/** Total number of wizard steps, including the final review step. */
export const TOTAL_WILL_STEPS = 9;
