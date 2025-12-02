import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { isPlanKey } from "@/lib/plans";
import { saveSubscriptionRecord } from "@/lib/subscription";

export async function POST(request: Request) {
  // read the request headers and convert to a Headers instance expected by auth.api.getSession
  const sessionHeaders = await headers();
  const headerEntries = Array.from(sessionHeaders.entries());
  const headerInit = Object.fromEntries(headerEntries);
  const userSession = await auth.api.getSession({
    headers: new Headers(headerInit),
  });

  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { sessionId?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const sessionId = payload?.sessionId;

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe client not configured:", error);
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    const metadataPlan = checkoutSession.metadata?.plan;
    const metadataUserId = checkoutSession.metadata?.userId;

    if (!metadataPlan || !isPlanKey(metadataPlan)) {
      return NextResponse.json(
        { error: "Invalid plan metadata." },
        { status: 400 }
      );
    }

    if (metadataUserId !== userSession.user.id) {
      return NextResponse.json(
        { error: "Plan does not belong to current user." },
        { status: 403 }
      );
    }

    const stripeSubscription =
      typeof checkoutSession.subscription === "object"
        ? checkoutSession.subscription
        : null;

    const stripeCustomerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : (checkoutSession.customer?.id ?? null);

    const status =
      stripeSubscription?.status ?? checkoutSession.payment_status ?? "unknown";
    const subscriptionItems = stripeSubscription?.items?.data ?? [];
    const latestPeriodEnd = subscriptionItems.reduce(
      (latest, item) => Math.max(latest, item?.current_period_end ?? 0),
      0
    );
    const expiresAt =
      latestPeriodEnd > 0 ? new Date(latestPeriodEnd * 1000) : null;

    await saveSubscriptionRecord({
      checkoutSessionId: checkoutSession.id,
      userId: userSession.user.id,
      plan: metadataPlan,
      status,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription?.id ?? null,
      expiresAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    return NextResponse.json(
      { error: "Unable to complete subscription." },
      { status: 500 }
    );
  }
}
