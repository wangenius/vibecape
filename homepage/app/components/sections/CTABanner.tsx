import type { FC } from "react";
import { Link } from "react-router";

const DOWNLOAD_URL = "https://github.com/wangenius/vibecape/releases/latest";

export const CTABanner: FC = () => {
  return (
    <section className="py-20 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          开始使用 Vibecape
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          免费下载，本地运行。你的文档，你做主。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to={DOWNLOAD_URL}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            下载应用
          </Link>
          <Link
            to="https://github.com/wangenius/vibecape"
            target="_blank"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-5 py-3 text-sm text-foreground/90 transition hover:bg-foreground/5"
          >
            GitHub
          </Link>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          支持 macOS / Windows / Linux
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
