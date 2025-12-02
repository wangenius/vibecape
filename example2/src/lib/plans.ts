export const stripePlanConfig = {
  monthly: {
    priceEnv: "STRIPE_PRICE_MONTHLY",
    mode: "subscription",
  },
  yearly: {
    priceEnv: "STRIPE_PRICE_YEARLY",
    mode: "subscription",
  },
  lifetime: {
    priceEnv: "STRIPE_PRICE_LIFETIME",
    mode: "payment",
  },
} as const;

export type PlanKey = keyof typeof stripePlanConfig;

export const isPlanKey = (value: string | null | undefined): value is PlanKey =>
  typeof value === "string" && value in stripePlanConfig;
