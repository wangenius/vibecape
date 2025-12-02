"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { TbLogout, TbCreditCard } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { BiUser } from "react-icons/bi";
import { dialog } from "@/components/custom/DialogModal";

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Delay rendering anything that depends on client-only state (session, user image)
  // so that the server and first client render stay in sync and avoid hydration drift.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageUrl(session?.user.image || undefined);
  }, [session?.user.image]);

  useEffect(() => {
    if (session && !session.user.image) {
      fetch("/api/auth/user-image")
        .then((r) => r.json())
        .then((d) => {
          if (d?.imageUrl) setImageUrl(d.imageUrl as string);
        })
        .catch(() => {});
    }
  }, [session]);

  if (!mounted || isPending) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        disabled
      >
        <BiUser className="h-[18px] w-[18px]" />
      </Button>
    );
  }

  if (!session) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-4 text-sm font-medium"
        asChild
      >
        <Link href="/signin">Login</Link>
      </Button>
    );
  }

  const handleSignOut = () => {
    dialog.confirm({
      title: "Sign out",
      content: "Are you sure you want to sign out?",
      variants: "destructive",
      okText: "Sign out",
      cancelText: "Cancel",
      onOk: async () => {
        await signOut();
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border/50 transition-all duration-200"
        >
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={imageUrl} alt={session.user.name} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 p-1 border-border/40 bg-background/95 backdrop-blur-xl shadow-xl"
      >
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {session.user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem
          asChild
          className="p-2 cursor-pointer focus:bg-accent/50"
        >
          <Link
            href="/subscription"
            className="flex w-full items-center text-sm"
          >
            <TbCreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Subscription</span>
            <span className="ml-auto inline-flex h-4 items-center justify-center rounded-full bg-emerald-500/10 px-1.5 text-[10px] font-medium text-emerald-500">
              PRO
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="p-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <TbLogout className="mr-2 h-4 w-4" />
          <span className="text-sm">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
