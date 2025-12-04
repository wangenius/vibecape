import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full h-7 rounded-md border border-transparent px-1.5 text-sm text-foreground ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-muted hover:bg-muted/80 focus:bg-muted/80',
        outline: 'bg-transparent border-input hover:border-muted-foreground/30 focus:border-primary',
        ghost: 'bg-transparent hover:bg-muted/50 focus:bg-muted/50',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onValueChange'>,
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
        onChange={e => {
          onChange?.(e.target.value);
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
