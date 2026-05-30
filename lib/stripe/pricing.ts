/**
 * Pro / B2B per-seat pricing. Per Phase 0 decision (2026-05-29):
 *
 *   Starter    — $79 CAD/seat/month, 1–3 seats
 *   Team       — $69 CAD/seat/month, 4–10 seats
 *   Enterprise — custom, 11+ seats (sales contact, not self-serve checkout)
 *
 * The numbers below are the canonical source of truth that the UI quotes; the
 * actual price-IDs come from env vars (set per environment to point at the
 * real Stripe Product/Price). Keep both in sync when adjusting tiers.
 */

export type ProPlan = "pro_starter" | "pro_team" | "pro_enterprise";

export interface ProPlanConfig {
  plan: ProPlan;
  name: string;
  /** Monthly per-seat price in CAD (display only; Stripe is the source of $). */
  monthlyPerSeat: number;
  /** Inclusive seat range. `null` upper bound = no cap (enterprise). */
  seatMin: number;
  seatMax: number | null;
  /** Stripe recurring price ID — null until configured for this env. */
  priceId: string | null;
  /** Self-serve checkout supported. Enterprise is sales-led. */
  selfServe: boolean;
  blurb: string;
}

export const PRO_PLANS: Record<ProPlan, ProPlanConfig> = {
  pro_starter: {
    plan: "pro_starter",
    name: "Starter",
    monthlyPerSeat: 79,
    seatMin: 1,
    seatMax: 3,
    priceId: process.env.STRIPE_PRICE_PRO_STARTER ?? null,
    selfServe: true,
    blurb: "Small practices getting started. Up to 3 seats.",
  },
  pro_team: {
    plan: "pro_team",
    name: "Team",
    monthlyPerSeat: 69,
    seatMin: 4,
    seatMax: 10,
    priceId: process.env.STRIPE_PRICE_PRO_TEAM ?? null,
    selfServe: true,
    blurb: "Growing firms. 4–10 seats with volume pricing.",
  },
  pro_enterprise: {
    plan: "pro_enterprise",
    name: "Enterprise",
    monthlyPerSeat: 0, // custom
    seatMin: 11,
    seatMax: null,
    priceId: process.env.STRIPE_PRICE_PRO_ENTERPRISE ?? null,
    selfServe: false,
    blurb: "11+ seats with custom terms. Talk to sales.",
  },
};

/** Map a Stripe price ID back to our internal plan key. */
export function planFromPriceId(priceId: string | null | undefined): ProPlan | null {
  if (!priceId) return null;
  for (const cfg of Object.values(PRO_PLANS)) {
    if (cfg.priceId && cfg.priceId === priceId) return cfg.plan;
  }
  return null;
}

/**
 * Pick the right plan for a desired seat count. Used by the checkout flow so
 * buyers don't have to manually keep "5 seats" and "Team plan" in sync.
 */
export function planForSeatCount(seats: number): ProPlan {
  if (seats <= PRO_PLANS.pro_starter.seatMax!) return "pro_starter";
  if (seats <= PRO_PLANS.pro_team.seatMax!) return "pro_team";
  return "pro_enterprise";
}

/** Throws if the requested plan can't accommodate the seat count. */
export function validateSeatCount(plan: ProPlan, seats: number): string | null {
  const cfg = PRO_PLANS[plan];
  if (seats < cfg.seatMin) {
    return `${cfg.name} requires at least ${cfg.seatMin} seat${cfg.seatMin === 1 ? "" : "s"}.`;
  }
  if (cfg.seatMax !== null && seats > cfg.seatMax) {
    return `${cfg.name} supports up to ${cfg.seatMax} seats. Choose a higher tier.`;
  }
  return null;
}

/** Stable currency formatter for prices displayed in the Pro UI. */
export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}
