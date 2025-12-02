import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripePlanConfig, isPlanKey } from "@/lib/plans";

const FALLBACK_SUCCESS_PATH = "/subscription?status=success&session_id={CHECKOUT_SESSION_ID}";
const FALLBACK_CANCEL_PATH = "/subscription?status=cancelled";

const resolveBaseUrl = () =>
  process.env.STRIPE_CHECKOUT_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

const resolveSuccessUrl = () =>
  process.env.STRIPE_CHECKOUT_SUCCESS_URL || `${resolveBaseUrl()}${FALLBACK_SUCCESS_PATH}`;

const resolveCancelUrl = () =>
  process.env.STRIPE_CHECKOUT_CANCEL_URL || `${resolveBaseUrl()}${FALLBACK_CANCEL_PATH}`;

export async function GET(request: NextRequest) {
  const plan = request.nextUrl.searchParams.get("plan");

  if (!plan || !isPlanKey(plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const config = stripePlanConfig[plan];

  const rawHeaders = await headers();
  // convert ReadonlyHeaders to a standard Headers instance expected by auth.api.getSession
  const sessionHeaders = new Headers();
  for (const [key, value] of rawHeaders.entries()) {
    sessionHeaders.set(key, value);
  }

  const session = await auth.api.getSession({ headers: sessionHeaders });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const priceId = process.env[config.priceEnv];

  if (!priceId) {
    console.error(`Missing Stripe price env: ${config.priceEnv}`);
    return NextResponse.json({ error: "Plan unavailable." }, { status: 500 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe is not configured.", error);
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  try {
    const sessionUrl = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: resolveSuccessUrl(),
      cancel_url: resolveCancelUrl(),
      metadata: {
        plan,
        userId: session.user.id,
      },
      customer_email: session.user.email ?? undefined,
      allow_promotion_codes: true,
    });

    if (!sessionUrl.url) {
      throw new Error("Stripe Checkout did not return a URL.");
    }

    return NextResponse.redirect(sessionUrl.url, 303);
  } catch (error) {
    console.error("Stripe checkout session error.", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
