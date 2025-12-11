import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* 基础样式在 @styles/components.css @layer base input */
const inputVariants = cva("", {
  variants: {
    variant: {
      primary: "",
      default: "bg-transparent hover:bg-muted/50 focus:bg-muted/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "onValueChange">,
    VariantProps<typeof inputVariants> {
  onValueChange?: (data: string) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, onValueChange: onChange, ...props }, ref) => {
    return (
      <input
        type={type}
        autoComplete="off"
        className={cn(inputVariants({ variant, className }))}
        onChange={(e) => {
          onChange?.(e.target.value);
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
