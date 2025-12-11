import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* 基础样式在 @styles/components.css @layer base button */
const buttonVariants = cva("", {
  variants: {
    variant: {
      primary:
        "bg-primary/90 text-primary-foreground/80 hover:bg-primary hover:text-primary-foreground",
      destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      default: "",
    },
    size: {
      default: "w-auto [&_svg]:size-4 p-1.5 px-3 text-xs flex items-center gap-1.5",
      icon: "",
      full: "w-full justify-start [&_svg]:size-3.5 p-2 text-xs flex items-center gap-1.5",
      sidebar:
        "w-full justify-start h-9 [&_svg]:size-4 p-2 text-sm flex items-center gap-3",
    },
    actived: {
      true: "bg-muted-foreground/10",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    actived: false,
  },
});

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  actived?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, type, actived, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        type={type || "button"}
        className={cn(buttonVariants({ variant, size, className, actived }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
