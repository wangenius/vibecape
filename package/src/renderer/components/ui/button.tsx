import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent text-sm gap-2 px-2 h-7 text-muted-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:opacity-100 data-[state=open]:bg-muted-foreground/10 hover:bg-muted [&_svg]:size-4 flex-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground/90 hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground/90 hover:bg-primary/90",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent hover:bg-muted-foreground/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-6.5 p-0 [&_svg]:size-4 rounded-sm",
        full: "w-full justify-start",
      },
      full: {
        true: "w-full justify-start",
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
  }
);

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
