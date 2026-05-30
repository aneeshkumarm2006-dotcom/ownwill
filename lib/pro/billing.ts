"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { getStripe } from "@/lib/stripe/server";
import {
  PRO_PLANS,
  formatCAD,
  validateSeatCount,
  type ProPlan,
} from "@/lib/stripe/pricing";
import { requirePro, canManageBilling } from "@/lib/pro/auth";

type ActionResult<T = undefined> =
  | { error: null; data?: T }
  | { error: string; data?: undefined };

const fail = (message: string): ActionResult => ({ error: message });

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://ownwill.ca"
  ).replace(/\/$/, "");
}

interface OrgBillingRow {
  id: string;
  name: string;
  billing_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

async function fetchOrgBilling(orgId: string): Promise<OrgBillingRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name, billing_email, stripe_customer_id, stripe_subscription_id")
    .eq("id", orgId)
    .maybeSingle<OrgBillingRow>();
  return data ?? null;
}

/**
 * Get-or-create a Stripe Customer for the org. Writing the ID back to the
 * organizations row stops us from creating a fresh customer on every checkout
 * retry — which would orphan the abandoned ones and split the invoice history.
 */
async function ensureCustomer(
  org: OrgBillingRow,
  actorEmail: string,
): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: org.billing_email || actorEmail,
    name: org.name,
    metadata: { organization_id: org.id },
  });

  const admin = createAdminClient();
  await admin
    .from("organizations")
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq("id", org.id);

  return customer.id;
}

interface StartCheckoutArgs {
  plan: ProPlan;
  seatCount: number;
}

/**
 * Pro: create a Stripe Checkout session for the current org and redirect the
 * owner into it. Owner-only — we don't even let admins start a checkout because
 * billing is the company's relationship with us, not an operational concern.
 *
 * Enterprise tier is sales-led; this returns an error and the UI surfaces a
 * "Contact sales" CTA instead of the checkout button.
 */
export async function startProCheckout(args: StartCheckoutArgs): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageBilling(actor.role)) {
    return fail("Only the org owner can manage billing.");
  }

  const cfg = PRO_PLANS[args.plan];
  if (!cfg) return fail("Unknown plan.");
  if (!cfg.selfServe) {
    return fail("Enterprise plans are sales-led. Email sales@ownwill.ca.");
  }
  if (!cfg.priceId) {
    return fail("Stripe is not configured for this plan yet. Contact support.");
  }
  const seatErr = validateSeatCount(args.plan, args.seatCount);
  if (seatErr) return fail(seatErr);

  const org = await fetchOrgBilling(actor.organizationId);
  if (!org) return fail("Could not load your organization.");
  if (org.stripe_subscription_id) {
    return fail("Your firm already has a subscription. Manage it from the billing portal.");
  }

  const customerId = await ensureCustomer(org, actor.email);
  const origin = siteOrigin();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: cfg.priceId, quantity: args.seatCount }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    subscription_data: {
      metadata: {
        organization_id: org.id,
        plan: args.plan,
      },
    },
    metadata: {
      organization_id: org.id,
      plan: args.plan,
      seat_count: String(args.seatCount),
    },
    success_url: `${origin}/pro/billing?checkout=success`,
    cancel_url: `${origin}/pro/billing?checkout=canceled`,
  });

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.billing.checkout_start",
    targetType: "organization",
    targetId: org.id,
    metadata: {
      plan: args.plan,
      seat_count: args.seatCount,
      session_id: session.id,
    },
  });

  if (!session.url) {
    return fail("Stripe didn't return a checkout URL.");
  }
  redirect(session.url);
}

/**
 * Owner-only: bounce to the hosted Stripe billing portal so they can update
 * the card, change seat count, or cancel. Stays in sync with our DB via the
 * webhook handler — no need to round-trip writes through here.
 */
export async function openBillingPortal(): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageBilling(actor.role)) {
    return fail("Only the org owner can manage billing.");
  }

  const org = await fetchOrgBilling(actor.organizationId);
  if (!org?.stripe_customer_id) {
    return fail("No active subscription yet. Start one from the billing page.");
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${siteOrigin()}/pro/billing`,
  });

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.billing.portal_open",
    targetType: "organization",
    targetId: org.id,
  });

  redirect(portal.url);
}

export interface BillingOverview {
  plan: ProPlan | null;
  planName: string;
  seatCount: number;
  /** Active seat usage (accepted members), used vs. paid-for. */
  seatsUsed: number;
  status: string | null;
  hasSubscription: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  monthlyTotalLabel: string | null;
  perSeatLabel: string | null;
}

/**
 * Read-only billing snapshot for the /pro/billing page. Combines our local
 * `organizations` row with derived seat usage. Stripe is queried for invoices
 * separately so this stays cheap.
 */
export async function getBillingOverview(orgId: string): Promise<BillingOverview> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select(
      "plan, seat_count, subscription_status, stripe_subscription_id, current_period_end, cancel_at_period_end",
    )
    .eq("id", orgId)
    .maybeSingle<{
      plan: string | null;
      seat_count: number;
      subscription_status: string | null;
      stripe_subscription_id: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean | null;
    }>();

  const { count: seatsUsed } = await admin
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .not("accepted_at", "is", null);

  const planKey = (org?.plan ?? null) as ProPlan | null;
  const cfg = planKey ? PRO_PLANS[planKey] : null;
  const seatCount = org?.seat_count ?? 0;
  const monthlyTotal = cfg && cfg.monthlyPerSeat > 0
    ? cfg.monthlyPerSeat * seatCount
    : null;

  return {
    plan: planKey,
    planName: cfg?.name ?? "No plan",
    seatCount,
    seatsUsed: seatsUsed ?? 0,
    status: org?.subscription_status ?? null,
    hasSubscription: Boolean(org?.stripe_subscription_id),
    currentPeriodEnd: org?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(org?.cancel_at_period_end),
    monthlyTotalLabel: monthlyTotal !== null ? `${formatCAD(monthlyTotal)} / month` : null,
    perSeatLabel: cfg && cfg.monthlyPerSeat > 0
      ? `${formatCAD(cfg.monthlyPerSeat)} per seat`
      : null,
  };
}

export interface InvoiceRow {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

/**
 * Fetch the last N invoices straight from Stripe. We don't cache locally — the
 * portal is the system of record and the page only displays recent history.
 */
export async function listOrgInvoices(orgId: string, limit = 10): Promise<InvoiceRow[]> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .maybeSingle<{ stripe_customer_id: string | null }>();
  if (!org?.stripe_customer_id) return [];

  const stripe = getStripe();
  const invoices = await stripe.invoices.list({
    customer: org.stripe_customer_id,
    limit,
  });

  return invoices.data.map((i) => ({
    id: i.id ?? "",
    number: i.number ?? null,
    status: i.status ?? null,
    amountDue: i.amount_due ?? 0,
    amountPaid: i.amount_paid ?? 0,
    currency: (i.currency ?? "cad").toUpperCase(),
    created: i.created ?? 0,
    hostedInvoiceUrl: i.hosted_invoice_url ?? null,
    invoicePdf: i.invoice_pdf ?? null,
  }));
}

