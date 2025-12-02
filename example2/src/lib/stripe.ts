import Stripe from "stripe";

let stripeClient: Stripe | null = null;

const API_VERSION: Stripe.LatestApiVersion = "2025-10-29.clover";

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: API_VERSION,
  });

  return stripeClient;
}
