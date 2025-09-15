import { FC } from "react";
import Link from "next/link";

export const CTABanner: FC = () => {
  return (
    <section className="py-20 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Build faster. Ship sooner.</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Vibecape helps product creators move from idea to live product with less boilerplate and a consistent workflow.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
          >
            Read the Docs
          </Link>
          <Link
            href="https://github.com/wangenius/vibecape"
            target="_blank"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-5 py-3 text-sm text-foreground/90 transition hover:bg-foreground/5"
          >
            Star on GitHub
          </Link>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Quick start: <code className="mx-1">npm i vibecape</code> → <code className="mx-1">vibe init</code>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
