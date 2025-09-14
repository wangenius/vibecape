import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";

import "@/styles/globals.css";
import { Navbar } from "@/components/sections/navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "vibecape",
  description: "the cape of your vibe journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-black.svg" />
        <title>vibecape</title>
      </head>
      <body className={"min-h-screen"}>
        <Toaster theme="light" richColors position={"top-center"} />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
