import Link from "next/link";
import { products } from "@/lib/source";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Page() {
  const posts = [...products.getPages()];
  const [featured, ...rest] = posts;

  return (
    <main className="flex-1 overflow-auto">
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 mx-auto w-full max-w-6xl px-4 md:py-12">
        {/* Featured Post */}
        {featured && (
          <Link
            key={featured.url}
            href={featured.url}
            className="group mt-8 block overflow-hidden rounded-xl border bg-fd-card p-8 transition-colors hover:bg-fd-accent"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="mt-2 text-2xl font-semibold leading-snug tracking-tight md:text-3xl md:leading-snug group-hover:underline">
                  {featured.data.title}
                </h2>
                {featured.data.description ? (
                  <p className="mt-3 text-fd-muted-foreground">
                    {featured.data.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-2 md:mt-0">
                <span
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "inline-flex items-center gap-2"
                  )}
                >
                  阅读 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="group flex flex-col overflow-hidden rounded-xl border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
            >
              <p className="mt-2 text-lg font-medium group-hover:underline">
                {post.data.title}
              </p>
              {post.data.description ? (
                <p className="mt-2 text-sm text-fd-muted-foreground">
                  {post.data.description}
                </p>
              ) : null}
              <div className="mt-6 flex items-center justify-end text-sm">
                <span className="inline-flex items-center gap-1 text-fd-foreground/80">
                  阅读 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
