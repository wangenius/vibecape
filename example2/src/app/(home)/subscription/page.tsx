"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Zap, Minus, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  SubscriptionStatusDto,
  SubscriptionStatusResponse,
} from "@/lib/subscription";
import { PlanKey } from "@/lib/plans";
import { useLanguage } from "@/locales/LanguageProvider";
import type { Locale } from "@/locales/dictionaries";

type BenefitTierKey = "free" | "monthly" | "yearly" | "lifetime";

type BenefitRowKey =
  | "publicContentAccess"
  | "fullContentAccess"
  | "caseStudies"
  | "knowledgeUpdates"
  | "productEarlyAccess"
  | "communitySupport"
  | "newsletterInsights"
  | "privateDownloads"
  | "roadmapUpdates"
  | "exposureSupport"
  | "quarterlyWorkshops"
  | "oneOnOneCoaching"
  | "prioritySupport"
  | "invoiceSupport"
  | "lifetimePerks";

type BenefitRow = {
  key: BenefitRowKey;
} & Partial<Record<BenefitTierKey, boolean>>;

type CheckoutFeedback = {
  title: string;
  description: string;
  variant: "info" | "success" | "error";
};

const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  cn: "cn",
};

const PLAN_ORDER: PlanKey[] = ["monthly", "yearly", "lifetime"];

const planMeta: Record<
  PlanKey,
  { price: string; href: string; isPopular?: boolean }
> = {
  monthly: {
    price: "¥19",
    href: "/api/checkout?plan=monthly",
  },
  yearly: {
    price: "¥99",
    href: "/api/checkout?plan=yearly",
    isPopular: true,
  },
  lifetime: {
    price: "¥299",
    href: "/api/checkout?plan=lifetime",
  },
};

const benefitRows: BenefitRow[] = [
  {
    key: "publicContentAccess",
    free: true,
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "fullContentAccess",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "caseStudies",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "knowledgeUpdates",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "productEarlyAccess",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "communitySupport",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "newsletterInsights",
    free: true,
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "privateDownloads",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "roadmapUpdates",
    monthly: true,
    yearly: true,
    lifetime: true,
  },
  {
    key: "exposureSupport",
    yearly: true,
    lifetime: true,
  },
  {
    key: "quarterlyWorkshops",
    yearly: true,
    lifetime: true,
  },
  {
    key: "oneOnOneCoaching",
    yearly: true,
    lifetime: true,
  },
  {
    key: "prioritySupport",
    yearly: true,
    lifetime: true,
  },
  {
    key: "invoiceSupport",
    yearly: true,
    lifetime: true,
  },
  {
    key: "lifetimePerks",
    lifetime: true,
  },
];

const benefitTierOrder: BenefitTierKey[] = [
  "free",
  "monthly",
  "yearly",
  "lifetime",
];

const formatExpirationDate = (
  value?: string | null,
  locale = LOCALE_TAGS.en
) => {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(value)
    );
  } catch {
    return null;
  }
};

const computeFallbackExpiration = (
  plan?: PlanKey,
  createdAt?: string | null,
  locale = LOCALE_TAGS.en
) => {
  if (!plan || plan === "lifetime" || !createdAt) {
    return null;
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const fallback = new Date(parsed);
  if (plan === "monthly") {
    fallback.setMonth(fallback.getMonth() + 1);
  } else if (plan === "yearly") {
    fallback.setFullYear(fallback.getFullYear() + 1);
  } else {
    return null;
  }

  return formatExpirationDate(fallback.toISOString(), locale);
};

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const sessionIdParam = searchParams.get("session_id");
  const { data: session, isPending } = useSession();
  const { dictionary, language } = useLanguage();
  const {
    benefits,
    info,
    buttons,
    feedback: feedbackMessages,
    plans: localizedPlans,
    expiration,
  } = dictionary.subscription;
  const localeTag = LOCALE_TAGS[language] ?? LOCALE_TAGS.en;
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [processedSessionId, setProcessedSessionId] = useState<string | null>(
    null
  );
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusDto | null>(null);

  useEffect(() => {
    if (statusParam === "cancelled") {
      setFeedback({
        variant: "error",
        title: feedbackMessages.cancelled.title,
        description: feedbackMessages.cancelled.description,
      });
      return;
    }

    if (
      statusParam !== "success" ||
      !sessionIdParam ||
      processedSessionId === sessionIdParam
    ) {
      return;
    }

    setProcessedSessionId(sessionIdParam);
    setFeedback({
      variant: "info",
      title: feedbackMessages.processing.title,
      description: feedbackMessages.processing.description,
    });

    fetch("/api/subscription/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: sessionIdParam }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error ?? feedbackMessages.syncError.description
          );
        }
        setFeedback({
          variant: "success",
          title: feedbackMessages.success.title,
          description: feedbackMessages.success.description,
        });
      })
      .catch((error) => {
        setFeedback({
          variant: "error",
          title: feedbackMessages.syncError.title,
          description:
            (error as Error)?.message ?? feedbackMessages.syncError.description,
        });
      });
  }, [feedbackMessages, processedSessionId, sessionIdParam, statusParam]);

  useEffect(() => {
    let isMounted = true;

    if (isPending || !session) {
      setSubscriptionStatus(null);
      return () => {
        isMounted = false;
      };
    }

    fetch("/api/subscription/status", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        return (await res.json()) as SubscriptionStatusResponse | null;
      })
      .then((payload) => {
        if (!isMounted) return;
        setSubscriptionStatus(payload?.subscription ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setSubscriptionStatus(null);
      });
    return () => {
      isMounted = false;
    };
  }, [session, isPending]);

  const isSubscribed = Boolean(subscriptionStatus?.isActive);
  const expirationLabel = formatExpirationDate(
    subscriptionStatus?.expiresAt,
    localeTag
  );
  const fallbackExpirationLabel = computeFallbackExpiration(
    subscriptionStatus?.plan,
    subscriptionStatus?.createdAt,
    localeTag
  );
  const isLifetimePlan = subscriptionStatus?.plan === "lifetime";
  const formattedExpiration = isLifetimePlan
    ? expiration.permanent
    : expirationLabel ?? fallbackExpirationLabel ?? expiration.pending;
  const currentPlanButtonLabel = isLifetimePlan
    ? buttons.lifetimeActive
    : `${buttons.currentPlanPrefix}${formattedExpiration}`;

  const handleCheckout = (href: string) => {
    if (!session) {
      const next = encodeURIComponent(href);
      router.push(`/signin?next=${next}`);
      return;
    }
    router.push(href);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-24"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <span className="h-px w-16 bg-fd-foreground/20" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
                Membership
              </span>
            </div>
            <h1 className="text-4xl font-medium tracking-tighter sm:text-6xl text-fd-foreground">
              Invest in your craft.
            </h1>
            <p className="text-xl text-fd-muted-foreground font-light tracking-tight">
              Join a community of architects and thinkers pushing the boundaries of design technology.
            </p>
          </motion.div>

          {feedback && (
            <motion.div variants={itemVariants}>
              <Alert
                variant={feedback.variant === "error" ? "destructive" : "default"}
                className="border-fd-border bg-fd-card text-fd-foreground"
              >
                <AlertTitle>{feedback.title}</AlertTitle>
                <AlertDescription>{feedback.description}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Plans Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {PLAN_ORDER.map((planKey) => {
              const planTranslation = localizedPlans[planKey];
              const planDetails = planMeta[planKey];
              const isCurrentPlan = planKey === subscriptionStatus?.plan;
              const isLifetime = planKey === "lifetime";

              const buttonLabel = isSubscribed
                ? isCurrentPlan
                  ? currentPlanButtonLabel
                  : buttons.alreadyMember
                : planTranslation.cta;

              return (
                <motion.div
                  key={planKey}
                  variants={itemVariants}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-xl border p-8 transition-all hover:-translate-y-1",
                    isLifetime
                      ? "bg-fd-foreground text-fd-background border-fd-foreground"
                      : "bg-fd-card border-fd-border hover:border-fd-foreground/50"
                  )}
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3
                        className={cn(
                          "text-lg font-medium tracking-wide uppercase",
                          isLifetime ? "text-fd-background" : "text-fd-foreground"
                        )}
                      >
                        {planTranslation.name}
                      </h3>
                      <p
                        className={cn(
                          "text-sm",
                          isLifetime
                            ? "text-fd-background/70"
                            : "text-fd-muted-foreground"
                        )}
                      >
                        {planTranslation.tagline}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl font-mono font-medium",
                          isLifetime
                            ? "text-fd-background"
                            : "text-fd-foreground"
                        )}
                      >
                        {planDetails.price}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          isLifetime
                            ? "text-fd-background/60"
                            : "text-fd-muted-foreground"
                        )}
                      >
                        {planTranslation.period}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <button
                      onClick={() => handleCheckout(planDetails.href)}
                      disabled={isPending || isSubscribed}
                      className={cn(
                        "flex w-full items-center justify-between border-b pb-2 text-sm font-medium transition-all hover:opacity-70 disabled:opacity-50",
                        isLifetime
                          ? "border-fd-background text-fd-background"
                          : "border-fd-foreground text-fd-foreground"
                      )}
                    >
                      <span>{buttonLabel}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="space-y-3">
                      {benefitRows
                        .filter((row) => row[planKey])
                        .slice(0, 5)
                        .map((row) => (
                          <div
                            key={row.key}
                            className={cn(
                              "flex items-center gap-3 text-sm",
                              isLifetime
                                ? "text-fd-background/80"
                                : "text-fd-muted-foreground"
                            )}
                          >
                            <Check className="h-3.5 w-3.5 shrink-0" />
                            <span>{benefits.rows[row.key]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detailed Comparison */}
          <motion.section variants={itemVariants} className="space-y-12">
            <div className="border-t border-fd-border pt-12">
              <h3 className="mb-12 text-xs font-medium uppercase tracking-widest text-fd-muted-foreground">
                Feature Comparison
              </h3>

              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-fd-border pb-4 text-xs font-medium uppercase tracking-wider text-fd-muted-foreground">
                    <div className="pl-4">{benefits.headerLabel}</div>
                    {benefitTierOrder.map((tier) => (
                      <div key={tier} className="text-center">
                        {benefits.tiers[tier]}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-fd-border/40">
                    {benefitRows.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 py-4 text-sm transition-colors hover:bg-fd-muted/20"
                      >
                        <div className="pl-4 font-medium text-fd-foreground/80">
                          {benefits.rows[row.key]}
                        </div>
                        {benefitTierOrder.map((tier) => (
                          <div
                            key={`${row.key}-${tier}`}
                            className="flex justify-center"
                          >
                            {row[tier] ? (
                              <Check className="h-4 w-4 text-fd-foreground" />
                            ) : (
                              <Minus className="h-4 w-4 text-fd-border" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Footer Info */}
          <motion.section
            variants={itemVariants}
            className="border-t border-fd-border pt-12 flex flex-col gap-6 text-sm text-fd-muted-foreground md:flex-row md:justify-between"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>{info.payment}</span>
            </div>
            <div>
              {info.support.beforeLink}
              <Link
                className="text-fd-foreground hover:underline underline-offset-4"
                href="/about"
              >
                {info.support.linkText}
              </Link>
              {info.support.afterLink}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" />
      }
    >
      <SubscriptionPageContent />
    </Suspense>
  );
}
