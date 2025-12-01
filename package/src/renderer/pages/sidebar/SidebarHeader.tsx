import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState } from "react";
import { BsStars } from "react-icons/bs";
import { PiPlus } from "react-icons/pi";

interface CreateBarProps {
  left: React.ReactNode;
  AICreate: React.ElementType;
  list: {
    icon: React.ElementType;
    label: string;
    onClick: () => any;
  }[];
}

export const SidebarHeader = ({ left, AICreate, list }: CreateBarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-none flex gap-2.5 items-center justify-between">
      <div>{left}</div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="p-1 h-7 w-7 hover:bg-muted-foreground/10"
              variant="ghost"
            >
              <PiPlus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {list.map((item) => {
              return (
                <DropdownMenuItem key={item.label} onClick={item.onClick}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className="text-xs hover:bg-muted-foreground/10"
              variant={"ghost"}
            >
              <BsStars /> AI创建
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-4" side={"bottom"} align={"start"}>
            <AICreate close={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
