'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      onInteractOutside={e => {
        const target = e.target as Element;
        if (!target) return;

        // 检查点击是否在 Popover 内容区域内
        const isClickInPopover = target.closest(
          '[data-radix-popper-content-wrapper]'
        );
        if (isClickInPopover) return;

        // 检查点击是否在菜单或对话框内
        const isClickInMenu = target.closest('[role="menu"]');
        const isClickInDropdown = target.closest(
          '[data-radix-dropdown-menu-content]'
        );
        const isClickInDialog = target.closest('[role="dialog"]');
        const isClickInDialogOverlay = target.closest(
          '[data-radix-dialog-overlay]'
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
      className={cn('popover-content animate-popover max-h-[99vh]', className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
