import { type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { apiOk, apiError } from "@/lib/api/response";

/**
 * Stripe webhook receiver. Verifies the signature, then (TODO) updates the
 * payments table + profiles.plan via the admin client, triggers PDF generation,
 * and sends the signing-instructions email.
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

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      // TODO: record payment, update profiles.plan, generate PDF, send email.
      break;
    default:
      break;
  }

  return apiOk({ received: true });
}
