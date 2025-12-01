import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface TagBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: string;
    label: string;
    active?: boolean;
    className?: string;
}

export const TagBadge = forwardRef<HTMLDivElement, TagBadgeProps>(
    ({ color, label, active = false, className, onClick, ...props }, ref) => {
        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!onClick) return;

            e.stopPropagation();
            onClick(e);
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                    active ? "bg-primary/20 text-primary" : "bg-muted/50",
                    !active && "text-muted-foreground",
                    className
                )}
                onClick={handleClick}
                {...props}
            >
                <span
                    className={cn(
                        "w-2 h-2 rounded-full",
                        active ? "bg-primary" : "bg-muted-foreground"
                    )}
                    style={color && !active ? { backgroundColor: color } : undefined}
                ></span>
                <span className="text-xs truncate">{label}</span>
            </div>
        );
    }
);

TagBadge.displayName = "TagBadge";
