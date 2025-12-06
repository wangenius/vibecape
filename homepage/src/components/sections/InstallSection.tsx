"use client";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

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
    <div className="group flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3 transition-colors hover:border-foreground/20 hover:bg-muted/50">
      <code className="text-sm font-mono overflow-x-auto whitespace-pre text-foreground/90">
        {cmd}
      </code>
      <Button
        size="icon"
        variant="ghost"
        className="ml-3 h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export const InstallSection: FC = () => {
  return (
    <section className="py-24 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Up and Running
          </h2>
          <p className="text-muted-foreground mt-3">
            From zero to deployed in minutes.
          </p>
        </div>

        <div className="space-y-4">
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
