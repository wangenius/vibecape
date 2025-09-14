"use client";
import { IconBrandGithub, IconBrandX } from "@tabler/icons-react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-200 ${scrolled ? "bg-white border-b" : "bg-transparent"}`}
    >
      <div className="container mx-auto px-6 lg:px-8 py-3">
        {/* 桌面端导航 */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon-black.svg"
                alt="vibecape"
                width={32}
                height={32}
              />
              <span className="text-xl font-semibold tracking-tight">
                vibecape
              </span>
            </Link>

            {/* 导航链接 */}
            <div className="flex items-center space-x-6">
              <Link href="/docs">
                <Button variant="ghost" className="text-sm font-medium">
                  Docs
                </Button>
              </Link>
            </div>
          </div>

          {/* 用户认证区域 */}
          <div className="flex items-center gap-2">
            <Link
              href="https://x.com/iamwangenius"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <IconBrandX className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
            </Link>
            <Link
              href="https://github.com/wangenius/vibecape"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <IconBrandGithub className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
          </div>
        </nav>

        {/* 移动端导航 */}
        <div className="block lg:hidden">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon-black.svg"
                alt="vibecape"
                height={32}
                width={32}
              />
              <span className="text-xl font-semibold tracking-tight">
                vibecape
              </span>
            </Link>

            {/* 移动端菜单 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="flex items-center gap-2">
                      <Image
                        src="/icon-black.svg"
                        alt="vibecape"
                        width={32}
                        height={32}
                      />
                      <span className="text-xl font-semibold tracking-tight">
                        vibecape
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 p-4">
                  {/* 导航链接 */}
                  <div className="flex flex-col gap-4">
                    <Link href="/docs">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm font-medium"
                      >
                        Docs
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href="https://x.com/iamwangenius"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <IconBrandX className="h-4 w-4" />
                          <span className="sr-only">Twitter</span>
                        </Button>
                      </Link>
                      <Link
                        href="https://github.com/wangenius/vibecape"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <IconBrandGithub className="h-4 w-4" />
                          <span className="sr-only">GitHub</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
