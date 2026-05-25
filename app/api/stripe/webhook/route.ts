import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

/**
 * Stripe webhook receiver. Verifies the signature, then (TODO) updates the
 * payments table + profiles.plan via the admin client, triggers PDF generation,
 * and sends the signing-instructions email.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      // TODO: record payment, update profiles.plan, generate PDF, send email.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
