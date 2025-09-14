import { FC } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const CTABanner: FC = () => {
  return (
    <section className="py-16 border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          现在就把想法上线
        </h2>
        <p className="mt-3 text-muted-foreground">
          用 vibecape 开始你的下一个在线服务项目。
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/docs">开始使用</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="https://github.com/wangenius/vibecape" target="_blank">
              GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;

