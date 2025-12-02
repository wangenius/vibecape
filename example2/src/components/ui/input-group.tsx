"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

export type InputGroupProps = React.ComponentProps<"div">;

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group/input relative flex w-full flex-col gap-3 rounded-2xl border border-fd-border/60 bg-fd-card/80 p-3 shadow-sm transition-colors focus-within:border-fd-border focus-within:ring-2 focus-within:ring-fd-foreground/10",
        className
      )}
      {...props}
    />
  )
);
InputGroup.displayName = "InputGroup";

type InputGroupAddonAlign = "block-start" | "block-end" | "inline-end";

export type InputGroupAddonProps = React.ComponentProps<"div"> & {
  align?: InputGroupAddonAlign;
};

const addonAlignStyles: Record<InputGroupAddonAlign, string> = {
  "block-start": "flex flex-col gap-2",
  "block-end": "flex items-center justify-between gap-2",
  "inline-end": "flex items-center justify-end gap-2",
};

export const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  InputGroupAddonProps
>(({ align = "block-end", className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", addonAlignStyles[align], className)}
    {...props}
  />
));
InputGroupAddon.displayName = "InputGroupAddon";

const inputGroupButtonVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/25",
        outline:
          "border border-fd-border/60 bg-transparent text-fd-foreground hover:bg-fd-card/80 focus-visible:ring-fd-foreground/15",
        ghost:
          "text-fd-muted-foreground hover:bg-fd-accent/40 focus-visible:ring-fd-foreground/10",
        secondary:
          "bg-fd-secondary/80 text-fd-foreground hover:bg-fd-secondary focus-visible:ring-fd-foreground/10",
      },
      size: {
        "icon-sm": "size-9",
        icon: "size-10",
        sm: "h-9 rounded-full px-3",
        md: "h-10 rounded-full px-4",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "icon-sm",
    },
  }
);

export type InputGroupButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof inputGroupButtonVariants>;

export const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(({ className, variant, size, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(inputGroupButtonVariants({ variant, size, className }))}
    {...props}
  />
));
InputGroupButton.displayName = "InputGroupButton";

export type InputGroupTextareaProps = React.ComponentProps<"textarea">;

export const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "min-h-[72px] w-full resize-none border-none bg-transparent px-0 py-1 text-base leading-relaxed text-fd-foreground outline-none placeholder:text-fd-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
));
InputGroupTextarea.displayName = "InputGroupTextarea";
