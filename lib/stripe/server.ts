import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily-constructed server-side Stripe client. Instantiating at request time
 * (not module load) keeps `next build` from failing when the key is absent.
 * Never import in browser code.
 */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}
