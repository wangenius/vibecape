"use client";
import { RootProvider } from "fumadocs-ui/provider";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
