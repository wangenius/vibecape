import React, { useState, useRef, type ReactNode, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@site/src/components/ui/popover";
import { cn } from "@site/src/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// 添加特殊的CSS
const maskBorderStyles = `
@layer utilities {
  .mask-border {
    mask: linear-gradient(#fff 0 0) content-box, 
          linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
  }
}
`;

// 添加样式到文档头部
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = maskBorderStyles;
  document.head.appendChild(styleEl);
}

interface HoverPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  contentProps?: React.ComponentPropsWithoutRef<typeof PopoverContent>;
  triggerProps?: React.ComponentPropsWithoutRef<typeof PopoverTrigger>;
  variant?: "default" | "subtle" | "elegant";
}

export function HoverPopover({ 
  trigger, 
  content, 
  contentProps,
  triggerProps,
  variant = "elegant"
}: HoverPopoverProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Track mouse position for elegant hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (triggerRef.current && isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // Slightly longer delay for better UX
  };

  const handleContentMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleContentMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  // Custom styling based on variant
  const getContentClassNames = () => {
    const baseClass = "z-50 shadow-lg";
    
    switch (variant) {
      case "default":
        return cn(baseClass, "!bg-gray-900 !border-gray-700 !text-gray-100 rounded-xl");
      case "subtle":
        return cn(baseClass, "!bg-gray-900/95 backdrop-blur-sm !border-gray-800/50 !text-gray-100 rounded-xl");
      case "elegant":
      default:
        return cn(
          baseClass,
          "!bg-gradient-to-b !from-gray-900 !to-gray-950",
          "border !border-transparent relative",
          "!shadow-xl !shadow-indigo-900/10",
          "backdrop-blur-md !text-gray-100 rounded-xl",
          "before:absolute before:inset-0 before:rounded-xl before:p-[1px]",
          "before:bg-gradient-to-r before:from-primary/30 before:via-primary/30 before:to-primary/30",
          "before:-z-10 before:content-['']",
        );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild {...triggerProps}>
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative"
          style={{ 
            perspective: "1000px"
          }}
        >
          {trigger}
          {variant === "elegant" && isOpen && (
            <div 
              className="absolute inset-0 -z-10 opacity-20 blur-xl rounded-full bg-primary/30"
              style={{
                left: `${position.x - 25}px`,
                top: `${position.y - 25}px`,
                width: "50px",
                height: "50px",
                transition: "all 0.2s ease-out",
                pointerEvents: "none"
              }}
            />
          )}
        </div>
      </PopoverTrigger>
      <AnimatePresence>
        {isOpen && (
          <PopoverContent
            forceMount
            asChild
            onMouseEnter={handleContentMouseEnter}
            onMouseLeave={handleContentMouseLeave}
            sideOffset={10}
            {...contentProps}
            className={cn(getContentClassNames(), contentProps?.className)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {content}
              {variant === "elegant" && (
                <div className="absolute inset-0 rounded-xl pointer-events-none" />
              )}
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  );
} 