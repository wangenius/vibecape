import { MessageSquare, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { toggleBayBar, useView } from "@/hook/useView";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useLanguage } from "@/locales/LanguageProvider";
import { LanguageSwitcher } from "@/locales/LanguageSwitcher";
import type { Dictionary } from "@/locales/dictionaries";
import {
  BsLayoutSidebarReverse,
  BsLayoutSidebarInsetReverse,
  BsSun,
  BsMoon,
} from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { cn } from "@/lib/cn";

type NavLink = {
  id: keyof Dictionary["navigation"]["links"];
  url: string;
};

const navLinks: NavLink[] = [
  { id: "techne", url: "/docs/techne" },
  { id: "venture", url: "/docs/venture" },
  { id: "anthropocene", url: "/docs/anthropocene" },
  { id: "blog", url: "/blog" },
  { id: "products", url: "/products" },
  { id: "subscribe", url: "/subscription" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dictionary } = useLanguage();
  const { navigation } = dictionary;
  const { isBayBarOpen } = useView();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openSearchDialog = () => {
    if (typeof window === "undefined") return;

    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      code: "KeyK",
      metaKey: isMac,
      ctrlKey: !isMac,
    });

    window.dispatchEvent(event);
  };

  const resolveNavLink = (link: NavLink) => {
    const href = link.url;
    const active = pathname === href || pathname?.startsWith(`${href}/`);
    return { href, active };
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="mr-8 flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/icon.png"
            alt="Logo"
            width={24}
            height={24}
            className="rounded-sm"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const { href, active } = resolveNavLink(link);
            return (
              <Link
                key={link.url}
                href={href}
                className={cn(
                  "text-[13px] font-medium transition-colors duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground/80 hover:text-foreground"
                )}
              >
                {navigation.links[link.id]}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/40"
            onClick={openSearchDialog}
            title={navigation.actions.search}
          >
            <BiSearch className="h-[18px] w-[18px]" />
            <span className="sr-only">{navigation.actions.search}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/40"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={navigation.actions.toggleTheme}
          >
            <BsSun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <BsMoon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{navigation.actions.toggleTheme}</span>
          </Button>

          <LanguageSwitcher />

          <div className="h-4 w-px bg-border/40 mx-2" />

          <UserMenu />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 ml-1 text-muted-foreground hover:text-foreground hover:bg-accent/40",
              isBayBarOpen && "bg-accent/50 text-foreground"
            )}
            onClick={() => toggleBayBar()}
            title={navigation.actions.chat}
          >
            {isBayBarOpen ? (
              <BsLayoutSidebarInsetReverse className="h-[18px] w-[18px]" />
            ) : (
              <BsLayoutSidebarReverse className="h-[18px] w-[18px]" />
            )}
            <span className="sr-only">{navigation.actions.chat}</span>
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={openSearchDialog}
          >
            <Search className="h-[18px] w-[18px]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => toggleBayBar()}
          >
            <MessageSquare className="h-[18px] w-[18px]" />
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-[300px] p-0 border-l border-border/40"
            >
              <SheetTitle className="sr-only">
                {navigation.sheet.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {navigation.sheet.description}
              </SheetDescription>

              <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                <div className="p-6 pt-12 flex flex-col gap-8">
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => {
                      const { href, active } = resolveNavLink(link);
                      return (
                        <Link
                          key={link.url}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "text-lg font-medium transition-colors",
                            active ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {navigation.links[link.id]}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="h-px w-full bg-border/40" />

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Theme
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setTheme(theme === "dark" ? "light" : "dark")
                        }
                      >
                        <BsSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <BsMoon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Language
                      </span>
                      <LanguageSwitcher />
                    </div>
                    <div className="pt-4">
                      <UserMenu />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
