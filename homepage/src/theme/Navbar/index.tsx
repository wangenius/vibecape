import React from 'react';
import Link from "@docusaurus/Link";
import { useThemeConfig } from "@docusaurus/theme-common";
import {
  useHideableNavbar,
  useNavbarMobileSidebar,
} from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import { HoverPopover } from "@site/src/components/HoverPopover";
import { Button } from "@site/src/components/ui/button";
import NavbarMobileSidebar from "@theme/Navbar/MobileSidebar";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";
import { TbBrandDiscordFilled, TbBrandGithub } from "react-icons/tb";
import type NavbarType from '@theme/Navbar';
import type {WrapperProps} from '@docusaurus/types';

type Props = WrapperProps<typeof NavbarType>;

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm !text-gray-100 hover:bg-primary-foreground/30 rounded !no-underline transition-all duration-200"
    >
      {children}
    </Link>
  );
}

function NavbarBackdrop(props: ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      {...props}
      className={clsx("navbar-sidebar__backdrop", props.className)}
    />
  );
}

export default function NavbarWrapper(props: Props): React.ReactElement {
  const {
    navbar: { hideOnScroll },
  } = useThemeConfig();
  const { navbarRef } = useHideableNavbar(hideOnScroll);
  const mobileSidebar = useNavbarMobileSidebar();

  const popoverContentClass =
    "w-56 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 p-2 text-gray-100 shadow-lg shadow-indigo-900/20 backdrop-blur-sm";

  return (
    <>
      <nav
        ref={navbarRef}
        aria-label={translate({
          id: "theme.NavBar.navAriaLabel",
          message: "Main",
          description: "The ARIA label for the main navigation",
        })}
        className={clsx(
          "navbar !sticky top-0 left-0 right-0 z-50 !h-14 !border-none !shadow-none !bg-transparent"
        )}
      >
        <div className="flex justify-between items-center w-full px-1 py-3 rounded-full bg-gradient-to-r from-gray-950 to-gray-900 text-gray-100 shadow-xl shadow-indigo-900/10 border border-gray-800/50 mx-auto max-w-7xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 !text-gray-100 !no-underline"
            >
              <img src="/icon-white.svg" alt="vibecape Logo" className="w-8 h-8" />
              <span className="text-lg font-bold text-gray-100">vibecape</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <HoverPopover
              variant="elegant"
              trigger={
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                >
                  Product <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              }
              content={
                <>
                  <NavItem href="/">vibecape</NavItem>
                  <NavItem href="/product/market">Marketplace</NavItem>
                </>
              }
              contentProps={{ className: popoverContentClass }}
            />

            <Link to="/docs/introduction">
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
              >
                Documentation
              </Button>
            </Link>

            <Link to="/pricing">
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
              >
                Pricing
              </Button>
            </Link>

            <HoverPopover
              variant="elegant"
              trigger={
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                >
                  Community <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              }
              content={
                <>
                  <NavItem href="https://discord.gg/gqC9SVY3zM">Discord</NavItem>
                  <NavItem href="https://qm.qq.com/q/vUIYSeYyLm">QQ</NavItem>
                </>
              }
              contentProps={{ className: popoverContentClass }}
            />

            <Link to="/blog">
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
              >
                Blog
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-100 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
              >
                About
              </Button>
            </Link>
            
          </div>
          <div className="flex items-center gap-2">
          <Button
              className="group size-8 relative rounded-full"
              variant="secondary"
              size="icon"
              onClick={() =>
                window.open("https://discord.gg/gqC9SVY3zM", "_blank")
              }
            >
              <TbBrandDiscordFilled className="w-6 h-6" />
            </Button>
            <Button
              className="group relative rounded-full"
              variant="secondary"
              size="sm"
              onClick={() =>
                 window.open("https://github.com/vibe-cli/vibe", "_blank")
                }
            >
              <TbBrandGithub className="w-6 h-6" />
              <div className="text-sm font-medium">Github</div>
            </Button>
          
          </div>
        </div>
        <NavbarBackdrop onClick={mobileSidebar.toggle} />
        <NavbarMobileSidebar />
      </nav>
    </>
  );
}
