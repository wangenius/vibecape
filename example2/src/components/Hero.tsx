"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { useLanguage } from "@/locales/LanguageProvider";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export const Hero = () => {
  const { dictionary } = useLanguage();
  const hero = dictionary.hero;
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [lastReadPath, setLastReadPath] = useState<string | null>(null);
  const { profile, cta, introLabel, mission } = hero;

  useEffect(() => {
    let isMounted = true;
    if (!session) {
      setIsSubscribed(null);
      return () => {
        isMounted = false;
      };
    }

    fetch("/api/subscription/status", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          subscription?: { isActive?: boolean };
        } | null;
      })
      .then((payload) => {
        if (!isMounted) return;
        setIsSubscribed(Boolean(payload?.subscription?.isActive));
      })
      .catch(() => {
        if (!isMounted) return;
        setIsSubscribed(null);
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("last-read-path");
      setLastReadPath(stored && stored.startsWith("/") ? stored : null);
    } catch {
      setLastReadPath(null);
    }
  }, []);

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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      className="relative mb-32 pt-24 md:pt-40"
      aria-labelledby="profile-hero-heading"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl"
      >
        <div className="space-y-10">
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-5"
          >
            <Image
              src={profile.avatar}
              alt={profile.name}
              width={72}
              height={72}
              className="rounded-full grayscale hover:grayscale-0 transition-all duration-500"
              priority
            />
            <span className="h-px w-12 bg-fd-foreground/10" />
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-fd-muted-foreground/80">
              {introLabel}
            </span>
          </motion.div>

          <div className="space-y-8">
            <motion.h1
              id="profile-hero-heading"
              variants={itemVariants}
              className="text-6xl font-medium tracking-tighter sm:text-8xl text-fd-foreground"
            >
              {profile.name}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl text-fd-muted-foreground font-light tracking-wide max-w-xl leading-relaxed"
            >
              {profile.tagline}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="space-y-6 max-w-lg pt-2"
            >
              <p className="text-base leading-loose text-fd-muted-foreground/80 font-light">
                {profile.description}
              </p>
              <p className="text-sm text-fd-muted-foreground/50 italic font-serif tracking-wide">
                &ldquo;{mission}&rdquo;
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-10 pt-16"
        >
          {/* Primary CTA */}
          {(!session || !isSubscribed) && (
            <Link
              href="/subscription"
              className="group flex items-center gap-3 text-sm font-medium text-fd-foreground transition-all hover:opacity-60"
            >
              <span className="border-b border-transparent group-hover:border-fd-foreground/50 transition-colors pb-0.5">
                {cta.secondary}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          {/* Secondary CTA */}
          {session ? (
            <Link
              href="#contact"
              className="text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              {cta.contact}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              {cta.login}
            </Link>
          )}

          {/* Tertiary CTA */}
          {session && isSubscribed ? (
            <Link
              href={lastReadPath ?? "/subscription"}
              className="flex items-center gap-2 text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              {cta.lastRead}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : null}
        </motion.div>
      </motion.div>
    </section>
  );
};
