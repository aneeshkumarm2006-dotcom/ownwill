import { type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { apiOk, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { planFromPriceId } from "@/lib/stripe/pricing";

/**
 * Stripe webhook receiver. Verifies the signature, then routes events by type.
 *
 * Customer-side B2C payments (one-time will purchases) → TODO when the real
 * customer Stripe flow lands. Pro / B2B subscriptions → handled here.
 *
 * IMPORTANT: webhooks can be delivered out of order and retried. Every handler
 * must be idempotent — re-applying the same event must converge to the same
 * state.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return apiError("Missing signature", 400);

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return apiError(`Webhook signature verification failed: ${message}`, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "payment_intent.succeeded":
        // Customer-side one-time will payment. Wire up when the B2C Stripe
        // flow lands — for now no-op so the webhook doesn't 500.
        break;
      default:
        break;
    }
  } catch (err) {
    // Failing the webhook tells Stripe to retry, which is what we want for
    // transient DB errors. Log the body so we can grep for what blew up.
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[stripe-webhook] handler failed", event.type, message);
    return apiError(`Handler error: ${message}`, 500);
  }

  return apiOk({ received: true });
}

/**
 * Persist a checkout completion that came from the Pro flow. We look up the
 * org via metadata (set when we created the session) and audit the conversion
 * — the actual subscription state is written by the subscription.updated event
 * that fires immediately after.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  const orgId = (session.metadata?.organization_id as string | undefined) ?? null;
  if (!orgId) return;

  const admin = createAdminClient();
  // Stash the customer ID in case ensureCustomer didn't already (e.g. promo-code
  // flows that hit Stripe-created customers).
  if (session.customer && typeof session.customer === "string") {
    await admin
      .from("organizations")
      .update({
        stripe_customer_id: session.customer,
        billing_email: session.customer_details?.email ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);
  }

  await logAuditEvent({
    actorId: orgId,
    actorEmail: session.customer_details?.email ?? "",
    action: "pro.billing.subscribe",
    targetType: "organization",
    targetId: orgId,
    metadata: {
      session_id: session.id,
      plan: session.metadata?.plan ?? null,
      seat_count: session.metadata?.seat_count ?? null,
    },
  });
}

/**
 * Mirror the relevant subscription state onto the org row. Fires for both
 * created and updated events; we write the same fields either way because
 * order isn't guaranteed.
 */
async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const orgId =
    (sub.metadata?.organization_id as string | undefined) ??
    (await orgIdFromCustomer(typeof sub.customer === "string" ? sub.customer : sub.customer?.id));
  if (!orgId) return;

  // A subscription can have multiple items in theory; for Pro we use a single
  // per-seat line item, so the first one carries plan + quantity.
  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const seatCount = item?.quantity ?? 1;
  const plan = planFromPriceId(priceId);
  // `current_period_end` lives on the subscription item (Stripe API v2024-09+)
  // for new accounts, on the subscription itself on older ones. Read both
  // shapes defensively so we keep working across API version bumps.
  const periodEndUnix =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: currentPeriodEnd,
    stripe_price_id: priceId,
    seat_count: seatCount,
    updated_at: new Date().toISOString(),
  };
  if (plan) update.plan = plan;
  // If Stripe says the sub is active/trialing, make sure the org isn't stuck
  // in 'suspended' from a prior cancel that's since been re-subscribed.
  if (sub.status === "active" || sub.status === "trialing") {
    update.status = "active";
  }

  await admin.from("organizations").update(update).eq("id", orgId);
}

/**
 * Cancellation: flip the org to suspended so the next requirePro() bounces
 * staff to login. We keep the subscription ID + customer ID around so the
 * billing portal still works if the owner wants to resubscribe.
 */
async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const orgId =
    (sub.metadata?.organization_id as string | undefined) ??
    (await orgIdFromCustomer(typeof sub.customer === "string" ? sub.customer : sub.customer?.id));
  if (!orgId) return;

  const admin = createAdminClient();
  await admin
    .from("organizations")
    .update({
      status: "suspended",
      subscription_status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  await logAuditEvent({
    actorId: orgId,
    actorEmail: "",
    action: "pro.billing.cancel",
    targetType: "organization",
    targetId: orgId,
    metadata: { subscription_id: sub.id },
  });
}

async function orgIdFromCustomer(customerId: string | undefined): Promise<string | null> {
  if (!customerId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}
