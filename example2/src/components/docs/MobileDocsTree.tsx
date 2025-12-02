"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";

export type DocsTreeNode = {
  url?: string;
  name?: string;
  title?: string;
  children?: DocsTreeNode[];
};

export function MobileDocsTree({ tree }: { tree: DocsTreeNode[] | any }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const renderNodes = (nodes: DocsTreeNode[], level = 0) => {
    return nodes.map((node) => {
      const href = node.url as string | undefined;
      const label = (node.name ?? node.title ?? href ?? "") as string;
      const isActive = href && pathname?.startsWith(href);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={href ?? label} className="flex flex-col">
          {href ? (
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center py-1.5 text-sm",
                level > 0 && "pl-4",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="truncate">{label}</span>
            </Link>
          ) : (
            <div
              className={cn(
                "py-1.5 text-xs font-semibold text-muted-foreground",
                level > 0 && "pl-4",
              )}
            >
              {label}
            </div>
          )}
          {hasChildren && renderNodes(node.children as DocsTreeNode[], level + 1)}
        </div>
      );
    });
  };

  if (!tree || (Array.isArray(tree) && tree.length === 0)) return null;

  const nodes: DocsTreeNode[] = Array.isArray(tree) ? tree : (tree.children ?? []);

  if (!nodes.length) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-12 z-40 h-8 w-8 md:hidden"
          aria-label="Open docs navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 max-w-xs">
        <SheetTitle className="text-sm font-semibold">Docs</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate documentation sections
        </SheetDescription>
        <nav className="mt-4 flex flex-col gap-1.5">
          {renderNodes(nodes)}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
