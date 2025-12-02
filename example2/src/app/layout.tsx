"use client";

import "@/app/global.css";
import "katex/dist/katex.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/locales/LanguageProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { SelectionProvider } from "@/components/docs/selection-quote";
import SearchDialog from "@/components/search";
import { Header } from "@/components/Header";
import { Chatbar } from "@/components/baybar/Chatbar";
import { useChatInputFocus } from "@/lib/useChatInputFocus";
import { useView } from "@/hook/useView";
import { cn } from "@/lib/utils";
import { useReadTracker } from "@/hook/useReadTracker";

export default function Layout({ children }: { children: ReactNode }) {
  useChatInputFocus(true, true); // 启用快捷键 + 自动切换 Baybar
  useReadTracker();
  const { isBayBarOpen } = useView();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <title>WANGENIUS</title>
      </head>
      <body
        className={cn(
          "flex flex-col min-h-screen max-h-screen overflow-hidden",
          isBayBarOpen && "baybar-open"
        )}
      >
        <ThemeProvider>
          <LanguageProvider>
            <RootProvider
              search={{
                SearchDialog,
              }}
            >
              <Header />
              <SelectionProvider>
                <main className="flex h-[calc(100vh-3rem)] w-full overflow-hidden">
                  {children}
                  <Chatbar />
                </main>
              </SelectionProvider>
            </RootProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
