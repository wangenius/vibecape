import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* 基础样式在 @styles/components.css @layer base button */
const buttonVariants = cva("", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      primary: "bg-muted text-muted-foreground hover:bg-primary/90 hover:text-primary-foreground",
      destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "",
      link: "text-primary underline-offset-4 hover:underline bg-transparent",
    },
    size: {
      default: "",
      sm: "px-3 text-xs h-6",
      lg: "h-10 px-6",
      icon: "size-7 p-0",
      full: "w-full justify-start",
    },
    actived: {
      true: "bg-muted-foreground/10",
      false: "",
    },
  },
  defaultVariants: {
    variant: "ghost",
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
