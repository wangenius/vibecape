import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: ReactNode | string;
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  dotColor?: string;
  rightContent?: ReactNode;
  className?: string;
}

export const CollapsiblePanel = ({
  title,
  children,
  isExpanded,
  onToggle,
  dotColor = 'hsl(var(--primary))',
  rightContent,
  className = '',
}: CollapsiblePanelProps) => {
  return (
    <div className={cn('bg-muted/60 rounded-xl overflow-hidden', className)}>
      <div
        className={cn(
          'px-4 py-2.5 h-12 cursor-pointer',
          'hover:bg-muted-foreground/5 transition-colors duration-200 flex items-center justify-between'
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div onClick={e => e.stopPropagation()}>{rightContent}</div>
      </div>
      {isExpanded && (
        <div className="p-2 border-t border-border/70">{children}</div>
      )}
    </div>
  );
};
