"use client";
import { type FC, useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";

const DOWNLOAD_URL = "https://github.com/wangenius/vibecape/releases/latest";
const ROLES = ["文档编辑", "AI 写作"] as const;

export const HeroSection: FC = () => {
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRoleIndex((i) => (i + 1) % ROLES.length), 2500);
    return () => clearInterval(id);
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
          AI 驱动的本地文档编辑器
          <br />
          <span className="text-4xl sm:text-5xl text-muted-foreground mt-2 block">
            专注于{" "}
            <span className="relative inline-block align-baseline">
              <span className="inline-flex min-w-[5ch] justify-center text-foreground">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={roleIndex}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="whitespace-nowrap"
                  >
                    {ROLES[roleIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </span>
        </motion.h1>

        <p className="mt-6 text-pretty text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
          本地优先，数据私有。支持多种 AI 模型，为每个项目定制 AI 上下文。
          基于 Tiptap 的现代富文本编辑器，支持 Markdown。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={DOWNLOAD_URL}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            下载应用
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-8 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/5"
          >
            查看文档
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500/50"></span>
            本地存储
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500/50"></span>
            多模型支持
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-orange-500/50"></span>
            跨平台
          </span>
        </div>
      </div>
    </section>
  );
};
