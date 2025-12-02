import { db } from "./db";
import { subscription as subscriptionTable } from "./db/schema";
import { desc, eq } from "drizzle-orm";
import { isPlanKey, type PlanKey } from "./plans";
import { v4 as uuidv4 } from "uuid";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);

type SubscriptionRecordInput = {
  checkoutSessionId: string;
  userId: string;
  plan: PlanKey;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  expiresAt: Date | null;
};

export async function saveSubscriptionRecord(entry: SubscriptionRecordInput) {
  const normalizedStatus = entry.status.toLowerCase();
  const now = new Date();

  const existing = await db
    .select()
    .from(subscriptionTable)
    .where(
      eq(subscriptionTable.stripeCheckoutSessionId, entry.checkoutSessionId)
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(subscriptionTable)
      .set({
        plan: entry.plan,
        status: normalizedStatus,
        stripeCustomerId: entry.stripeCustomerId,
        stripeSubscriptionId: entry.stripeSubscriptionId,
        expiresAt: entry.expiresAt,
        updatedAt: now,
      })
      .where(
        eq(subscriptionTable.stripeCheckoutSessionId, entry.checkoutSessionId)
      );
    return;
  }

  await db.insert(subscriptionTable).values({
    id: uuidv4(),
    userId: entry.userId,
    plan: entry.plan,
    status: normalizedStatus,
    stripeCustomerId: entry.stripeCustomerId,
    stripeSubscriptionId: entry.stripeSubscriptionId,
    stripeCheckoutSessionId: entry.checkoutSessionId,
    expiresAt: entry.expiresAt,
  });
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(subscriptionTable)
    .where(eq(subscriptionTable.userId, userId))
    .orderBy(desc(subscriptionTable.createdAt))
    .limit(5);

  return rows.some((record) =>
    ACTIVE_STATUSES.has(record.status?.toLowerCase() ?? "")
  );
}

export function isSubscriptionStatusActive(status?: string): boolean {
  return ACTIVE_STATUSES.has(status?.toLowerCase() ?? "");
}

export type SubscriptionRecord = {
  plan: PlanKey;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string;
};

export async function getLatestSubscription(
  userId: string
): Promise<SubscriptionRecord | null> {
  const rows = await db
    .select({
      plan: subscriptionTable.plan,
      status: subscriptionTable.status,
      expiresAt: subscriptionTable.expiresAt,
      createdAt: subscriptionTable.createdAt,
      stripeCustomerId: subscriptionTable.stripeCustomerId,
      stripeSubscriptionId: subscriptionTable.stripeSubscriptionId,
      stripeCheckoutSessionId: subscriptionTable.stripeCheckoutSessionId,
    })
    .from(subscriptionTable)
    .where(eq(subscriptionTable.userId, userId))
    .orderBy(desc(subscriptionTable.createdAt))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const record = rows[0];

  if (!isPlanKey(record.plan)) {
    return null;
  }

  return {
    plan: record.plan,
    status: record.status,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    stripeCheckoutSessionId: record.stripeCheckoutSessionId,
  };
}

export type SubscriptionStatusDto = {
  plan: PlanKey;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
};

export type SubscriptionStatusResponse = {
  subscription: SubscriptionStatusDto | null;
};
