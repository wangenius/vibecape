"use client";
import { type FC, useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";

const DOWNLOAD_URL = "https://github.com/wangenius/vibecape/releases/latest";

export const HeroSection: FC = () => {
  const [role, setRole] = useState<"writer" | "world-builder">("writer");

  useEffect(() => {
    const id = setTimeout(() => setRole("world-builder"), 2500);
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center">
      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 text-center">
        {/* Identity insight (subtle) */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1 text-[11px] text-muted-foreground">
          <span>AI‑native Studio</span>
          <span className="opacity-50">→</span>
          <span>Local First</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-balance text-5xl font-medium leading-[1.05] text-foreground sm:text-6xl"
        >
          Where Stories Come Alive
          <br />
          <span className="text-4xl sm:text-5xl text-muted-foreground mt-2 block">
            The AI-Native{" "}
            <span className="relative inline-block align-baseline">
              <span className="inline-flex min-w-[9ch] justify-center text-foreground">
                <AnimatePresence mode="wait" initial={false}>
                  {role === "writer" ? (
                    <motion.span
                      key="writer"
                      initial={{
                        y: "0.6em",
                        opacity: 0,
                        clipPath: "inset(0 0 100% 0)",
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        clipPath: "inset(0 0 0% 0)",
                      }}
                      exit={{
                        y: -12,
                        opacity: 0,
                        clipPath: "inset(0 0 100% 0)",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="whitespace-nowrap"
                    >
                      Novel Editor
                    </motion.span>
                  ) : (
                    <motion.span
                      key="world-builder"
                      initial={{
                        y: 12,
                        opacity: 0,
                        clipPath: "inset(0 0 100% 0)",
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        clipPath: "inset(0 0 0% 0)",
                      }}
                      exit={{}}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="whitespace-nowrap"
                    >
                      World Builder
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </span>
          </span>
        </motion.h1>

        <p className="mt-6 text-pretty text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
          Orchestrate characters, manage dynamics, and co-write with AI in a
          private, local-first environments. Designed for complex narratives and
          long-form storytelling.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={DOWNLOAD_URL}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Download for Mac
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-8 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/5"
          >
            Read the Docs
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500/50"></span>
            Local Storage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500/50"></span>
            Private AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-orange-500/50"></span>
            macOS Native
          </span>
        </div>
      </div>
    </section>
  );
};
