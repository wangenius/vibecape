"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      onInteractOutside={(e) => {
        const target = e.target as Element;
        if (!target) return;

        // 检查点击是否在 Popover 内容区域内
        const isClickInPopover = target.closest(
          "[data-radix-popper-content-wrapper]"
        );
        if (isClickInPopover) return;

        // 检查点击是否在菜单或对话框内
        const isClickInMenu = target.closest('[role="menu"]');
        const isClickInDropdown = target.closest(
          "[data-radix-dropdown-menu-content]"
        );
        const isClickInDialog = target.closest('[role="dialog"]');
        const isClickInDialogOverlay = target.closest(
          "[data-radix-dialog-overlay]"
        );

        // 如果点击在菜单、下拉菜单、对话框中，或者点击在触发器内，阻止关闭
        if (
          isClickInMenu ||
          isClickInDropdown ||
          isClickInDialog ||
          isClickInDialogOverlay
        ) {
          e.preventDefault();
        }
      }}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-sm data-[side=left]:slide-in-from-right-sm data-[side=right]:slide-in-from-left-sm data-[side=top]:slide-in-from-bottom-sm z-50 w-72 max-h-[99vh] origin-(--radix-popover-content-transform-origin) rounded-lg space-y-0.5 border outline-hidden p-1.5",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger, PopoverAnchor };
