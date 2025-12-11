"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitives.Root
> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "inline-flex shrink-0 cursor-pointer items-center justify-start rounded-full border-none transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/20 h-5 w-9 p-0.5",
      className
    )}
    ref={ref}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={
        "pointer-events-none block shrink-0 rounded-full border-none bg-background transition-transform duration-200 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-primary-foreground size-4 data-[state=checked]:translate-x-4"
      }
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = "Switch";

export { Switch };
