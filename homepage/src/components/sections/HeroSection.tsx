"use client";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASH_COMMAND = "npm i -g vibecape";

export const HeroSection: FC = () => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(BASH_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary mb-6 drop-shadow-md">
            Product with <span className="text-primary">vibecape</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
            A programming CLI tool for AI native coders. Boost your
            productivity, integrate AI capabilities, and accelerate
            development—out of the box, designed for modern AI programming
            scenarios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/docs">Start Now</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto overflow-hidden"
              onClick={copyToClipboard}
            >
              <code className="p-1 rounded-full">
                {copied ? "Copied!" : BASH_COMMAND}
              </code>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
