"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { GithubIcon, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
          <Link to="/" className="flex items-center gap-2 mr-4">
            <img
              src="/icon-black.svg"
              alt="vibecape"
              width={24}
              height={24}
              className="opacity-90"
            />
            <span className="text-lg font-medium tracking-tight">Vibecape</span>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              to="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              文档
            </Link>
            <Link
              to="https://github.com/wangenius/vibecape/releases/latest"
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              下载
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="https://github.com/wangenius/vibecape"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <GithubIcon className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex lg:hidden w-full items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/icon-black.svg" alt="vibecape" height={24} width={24} />
            <span className="text-lg font-medium tracking-tight">Vibecape</span>
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
                  <Link to="/" className="flex items-center gap-2">
                    <img
                      src="/icon-black.svg"
                      alt="vibecape"
                      width={24}
                      height={24}
                    />
                    <span className="text-lg font-medium">Vibecape</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8">
                <Link to="/docs">
                  <Button variant="ghost" className="w-full justify-start">
                    文档
                  </Button>
                </Link>
                <Link to="https://github.com/wangenius/vibecape/releases/latest" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    下载
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border">
                  <Link
                    to="https://github.com/wangenius/vibecape"
                    target="_blank"
                  >
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <GithubIcon className="h-4 w-4" />
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
