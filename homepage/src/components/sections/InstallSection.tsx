"use client";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";

const InstallRow: FC<{ cmd: string }> = ({ cmd }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
      <code className="text-sm overflow-x-auto whitespace-pre">{cmd}</code>
      <Button size="sm" variant="outline" className="ml-3 shrink-0" onClick={copy}>
        {copied ? "已复制" : "复制"}
      </Button>
    </div>
  );
};

export const InstallSection: FC = () => {
  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">安装与启动</h2>
          <p className="text-muted-foreground mt-3">一分钟上手 vibecape。</p>
        </div>

        <div className="space-y-3">
          <InstallRow cmd="npm install -g vibecape" />
          <InstallRow cmd="vibe create my-app" />
          <InstallRow cmd="vibe install auth --provider=clerk" />
          <InstallRow cmd="vibe install payments --provider=stripe" />
          <InstallRow cmd="npm run dev" />
        </div>
      </div>
    </section>
  );
};

export default InstallSection;

