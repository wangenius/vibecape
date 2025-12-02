"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/locales/LanguageProvider";
import type { Dictionary } from "@/locales/dictionaries";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Experience = Dictionary["timeline"]["experiences"][number];

const currentYear = new Date().getFullYear();
const CAREER_START_YEAR = 2022;

type TimelineItem = Experience & {
  nodeLabel: string;
  startYear: number;
  endYear: number;
};

const extractYear = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const normalizePeriod = (period: string) => {
  const [rawStart, rawEnd] = period
    .split("-")
    .map((part) => part?.trim() ?? "");
  const startYear = extractYear(rawStart) ?? currentYear;
  const hasExplicitEnd = Boolean(rawEnd);
  const endIsNow = hasExplicitEnd && /(now|present)/i.test(rawEnd);
  const parsedEnd = hasExplicitEnd ? extractYear(rawEnd) : null;
  const endYear = endIsNow ? currentYear : (parsedEnd ?? startYear);
  const normalizedStart = Math.max(startYear, CAREER_START_YEAR);
  const normalizedEnd = Math.max(endYear, normalizedStart);
  return {
    startYear: normalizedStart,
    endYear: normalizedEnd,
  };
};

export const Timeline = () => {
  const { dictionary } = useLanguage();
  const timeline = dictionary.timeline;
  const workHistory = timeline.experiences;

  const timelineItems: TimelineItem[] = useMemo(() => {
    const totalItems = workHistory.length;
    return workHistory.map((item, index) => ({
      ...item,
      nodeLabel: (totalItems - index).toString().padStart(2, "0"),
      ...normalizePeriod(item.period),
    }));
  }, [workHistory]);

  const timelineEntries = useMemo(() => {
    const typePriority = (type: TimelineItem["type"]) =>
      type === "product" ? 1 : 0;
    return [...timelineItems].sort((a, b) => {
      if (b.startYear === a.startYear) {
        const priorityDiff = typePriority(a.type) - typePriority(b.type);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        if (b.endYear !== a.endYear) {
          return b.endYear - a.endYear;
        }
      }
      return b.startYear - a.startYear;
    });
  }, [timelineItems]);

  const timelineRows = useMemo(() => {
    const map = new Map<number, TimelineItem[]>();
    timelineEntries.forEach((item) => {
      const list = map.get(item.startYear) ?? [];
      list.push(item);
      map.set(item.startYear, list);
    });
    return Array.from(map.entries())
      .map(([year, items]) => ({ year, items }))
      .sort((a, b) => b.year - a.year);
  }, [timelineEntries]);

  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [hoveredRange, setHoveredRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const closeModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeModal]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="space-y-16 mb-32">
      <div className="space-y-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-fd-muted-foreground/60"
        >
          {timeline.section.label}
        </motion.p>
        <div className="flex items-baseline justify-between pb-4">
          <motion.h2
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-light tracking-tight text-fd-foreground"
          >
            {timeline.section.title}
          </motion.h2>
          <Link
            href="/products"
            className="text-xs font-medium uppercase tracking-wider text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          >
            {timeline.section.viewProducts}
          </Link>
        </div>
      </div>

      <motion.div
        className="space-y-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {timelineRows.map((row) => (
          <div key={row.year} className="grid md:grid-cols-[100px_1fr] gap-8">
            <div className="pt-1">
              <span
                className={cn(
                  "text-xl font-light font-mono transition-colors duration-300",
                  hoveredRange &&
                    row.year >= hoveredRange.start &&
                    row.year <= hoveredRange.end
                    ? "text-fd-foreground"
                    : "text-fd-muted-foreground/30"
                )}
              >
                {row.year}
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
              {row.items.map((item) => (
                <motion.button
                  key={item.nodeLabel}
                  variants={itemVariants}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={() =>
                    setHoveredRange({
                      start: item.startYear,
                      end: item.endYear,
                    })
                  }
                  onMouseLeave={() => setHoveredRange(null)}
                  className={cn(
                    "group flex aspect-square w-[280px] max-w-full flex-col items-start justify-between p-6 text-left transition-all rounded-xl",
                    item.type === "product"
                      ? "bg-fd-foreground/5 hover:bg-fd-foreground/10"
                      : "hover:bg-fd-muted"
                  )}
                >
                  <div className="space-y-4 w-full">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 w-full">
                        {item.type === "product" && (
                          <span className="inline-flex shrink-0 rounded-full bg-fd-foreground/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-fd-foreground">
                            Product
                          </span>
                        )}
                        {item.company && (
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider text-fd-muted-foreground/60"
                            )}
                          >
                            {item.company}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium tracking-tight leading-tight text-fd-foreground">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3 text-fd-muted-foreground/80 font-light">
                    {item.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedItem ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md px-4 py-10"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[600px] bg-background p-8 md:p-12 rounded-2xl overflow-hidden ring-1 ring-border/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/20"
              >
                &times;
              </button>

              <div className="space-y-8 relative">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-3xl font-light tracking-tight text-foreground">
                      {selectedItem.title}
                    </h3>
                    {selectedItem.type === "product" && (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                        Product
                      </span>
                    )}
                  </div>
                  {selectedItem.company && (
                    <p className="uppercase tracking-widest text-xs font-medium text-muted-foreground/60">
                      @ {selectedItem.company}
                    </p>
                  )}
                </div>

                <div className="text-lg leading-relaxed font-light text-muted-foreground">
                  {selectedItem.description}
                </div>

                {selectedItem.context && (
                  <div className="pl-4 border-l-2 border-foreground/10 italic text-sm text-muted-foreground/80">
                    {selectedItem.context}
                  </div>
                )}

                {selectedItem.skills && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {selectedItem.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] uppercase tracking-wider text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
