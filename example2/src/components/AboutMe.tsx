"use client";

import { useLanguage } from "@/locales/LanguageProvider";
import Marquee from "@/components/ui/marquee";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Tag = ({
  text,
  className,
  separator = false,
}: {
  text: string;
  className?: string;
  separator?: boolean;
}) => {
  return (
    <div className="flex items-center gap-4 mx-4">
      <span
        className={cn(
          "text-xl font-light text-fd-muted-foreground transition-colors hover:text-fd-foreground whitespace-nowrap",
          className
        )}
      >
        {text}
      </span>
      {separator && <span className="text-fd-muted-foreground/20">/</span>}
    </div>
  );
};

export const AboutMe = () => {
  const { dictionary } = useLanguage();
  const hero = dictionary.hero;
  const { lab, personaStages, personaTags } = hero;

  // Prepare data for rows
  const row1 = personaTags;
  const row2 = personaStages.map((s) => s.value);
  // Split description into shorter segments for the marquee
  const row3 = lab.description
    .split(/[.,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <section id="about" className="mb-32 space-y-12 select-none">
      <div className="space-y-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-fd-muted-foreground/60"
        >
          Profile
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-light tracking-tight text-fd-foreground"
        >
          Manifesto
        </motion.h2>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12 space-y-8">
        {/* Row 1: Keywords - Clean Sans */}
        <Marquee pauseOnHover className="[--duration:40s]">
          {row1.map((tag, i) => (
            <Tag
              key={i}
              text={tag}
              className="font-medium text-fd-foreground/80"
            />
          ))}
        </Marquee>

        {/* Row 2: Stages - Monospace with separator */}
        <Marquee reverse pauseOnHover className="[--duration:35s]">
          {row2.map((tag, i) => (
            <Tag
              key={i}
              text={tag}
              separator
              className="font-mono text-base text-fd-muted-foreground/60"
            />
          ))}
        </Marquee>

        {/* Row 3: Narrative - Serif Italic */}
        <Marquee pauseOnHover className="[--duration:50s]">
          {row3.map((text, i) => (
            <Tag
              key={i}
              text={text}
              className="font-serif italic text-2xl text-fd-muted-foreground/70"
            />
          ))}
        </Marquee>

        {/* Row 4: Status - Highlighted */}
        <Marquee reverse pauseOnHover className="[--duration:45s]">
          <Tag
            text={lab.statusValue}
            className="text-emerald-600 dark:text-emerald-400 font-medium"
          />
          {row1.map((tag, i) => (
            <Tag key={`r4-${i}`} text={tag} className="opacity-50" />
          ))}
        </Marquee>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-background to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l from-background to-transparent"></div>
      </div>
    </section>
  );
};
