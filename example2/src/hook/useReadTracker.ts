"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "last-read-path";

export function useReadTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/") return;
    if (typeof window === "undefined") return;
    if (
      pathname.includes("docs") ||
      pathname.includes("blog") ||
      pathname.includes("product")
    )
      window.localStorage.setItem(STORAGE_KEY, pathname);
  }, [pathname]);
}
