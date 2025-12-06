"use client";
import { FC, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const INSTALL_CMD = "npm install -g vibecape";

export const HeroSection: FC = () => {
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"coder" | "creator">("coder");

  useEffect(() => {
    const id = setTimeout(() => setRole("creator"), 1600);
    return () => clearTimeout(id);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center">
      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 text-center">
        {/* Identity insight (subtle) */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1 text-[11px] text-muted-foreground">
          <span>AI‑native coder</span>
          <span className="opacity-50">→</span>
          <span>Product creator</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-balance text-5xl font-medium leading-[1.05] text-foreground sm:text-6xl"
        >
          The first CLI tool for{" "}
          <span className="relative inline-block align-baseline">
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-foreground/15" />
            <span className="inline-flex min-w-[9ch] justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {role === "coder" ? (
                  <motion.span
                    key="coder"
                    initial={{
                      y: "0.6em",
                      opacity: 0,
                      clipPath: "inset(0 0 100% 0)",
                    }}
                    animate={{ y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                    exit={{ y: -12, opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="whitespace-nowrap"
                  >
                    AI‑native Coder
                  </motion.span>
                ) : (
                  <motion.span
                    key="creator"
                    initial={{
                      y: 12,
                      opacity: 0,
                      clipPath: "inset(0 0 100% 0)",
                    }}
                    animate={{ y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                    exit={{}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="whitespace-nowrap"
                  >
                    Product Creator
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </span>
        </motion.h1>

        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
          Built for product creators: start from curated templates, add modules
          on demand, standardize scripts, and collaborate with AI in your
          terminal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
          >
            Get Started
          </Link>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-5 py-3 text-sm font-mono text-foreground/80 transition hover:bg-foreground/5"
          >
            <code>{copied ? "Copied!" : INSTALL_CMD}</code>
          </button>
          <Link
            href="https://github.com/wangenius/vibecape"
            target="_blank"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-5 py-3 text-sm text-foreground/90 transition hover:bg-foreground/5"
          >
            GitHub
          </Link>
        </div>

        <div className="mt-5 text-xs text-muted-foreground">
          Works with Node 18+ · Local-first · Zero-config
        </div>
      </div>
    </section>
  );
};
