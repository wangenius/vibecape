import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getLatestSubscription,
  isSubscriptionStatusActive
} from "@/lib/subscription";

export async function GET() {
  const sessionHeaders = await headers();
  const userSession = await auth.api.getSession({ headers: sessionHeaders });

  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await getLatestSubscription(userSession.user.id);

  if (!latest) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({
    subscription: {
      plan: latest.plan,
      status: latest.status,
      expiresAt: latest.expiresAt?.toISOString() ?? null,
      createdAt: latest.createdAt.toISOString(),
      isActive: isSubscriptionStatusActive(latest.status),
    },
  });
}
