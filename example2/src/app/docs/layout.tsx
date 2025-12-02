import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { source } from "@/lib/source";
import { SidebarTrigger } from "fumadocs-ui/components/layout/sidebar";


interface DocsLayoutProps {
  children: ReactNode;
}

export default function LangDocsLayout({ children }: DocsLayoutProps) {
  const tree = source.getPageTree();

  return (
    <div className="flex-1 flex flex-col">
      <DocsLayout
        tree={tree}
        nav={{
          enabled: false,
        }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
        sidebar={{
          collapsible: false,
          tabs: false,
          footer: null,
          banner: null,
        }}
        containerProps={{
          className:
            "bg-canvas-light dark:bg-canvas-dark [&>div:last-child]:py-0",
        }}
      >
        {/* Mobile docs sidebar trigger: positioned near header avatar */}

        <div className="md:hidden z-10000">
          <SidebarTrigger className="fixed left-12 top-2 z-40 h-8 w-8 inline-flex items-center justify-center">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>
        {children}
      </DocsLayout>
    </div>
  );
}
