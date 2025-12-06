"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconBrandGithub, IconBrandX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-transparent ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8 w-full">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <Image
              src="/icon-black.svg"
              alt="vibecape"
              width={24}
              height={24}
              className="opacity-90"
            />
            <span className="text-lg font-medium tracking-tight">vibecape</span>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/wangenius/vibecape"
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>

          <nav className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 text-sm text-muted-foreground hover:text-foreground"
                >
                  Lesson
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <Link
                  href="https://vibemeet.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DropdownMenuItem>
                    vibemeet: AI producting lesson
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="https://x.com/iamwangenius"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <IconBrandGithub className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex lg:hidden w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-black.svg"
              alt="vibecape"
              height={24}
              width={24}
            />
            <span className="text-lg font-medium tracking-tight">vibecape</span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <Image
                      src="/icon-black.svg"
                      alt="vibecape"
                      width={24}
                      height={24}
                    />
                    <span className="text-lg font-medium">vibecape</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8">
                <Link href="/docs">
                  <Button variant="ghost" className="w-full justify-start">
                    Docs
                  </Button>
                </Link>
                <Link href="https://vibetake.com" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    Templates
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border">
                  <Link href="https://x.com/iamwangenius" target="_blank">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <IconBrandX className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href="https://github.com/wangenius/vibecape"
                    target="_blank"
                  >
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <IconBrandGithub className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
