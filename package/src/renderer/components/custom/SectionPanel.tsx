import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionPanelProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  icon?: React.ElementType;
  actions?: React.ReactNode | ((isExpanded: boolean) => React.ReactNode);
  closed?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export const SectionPanel = (props: SectionPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(props.defaultExpanded ?? true);
  return (
    <section
      className={cn('space-y-1 bg-muted p-2 rounded-lg', props.className)}
    >
      <div
        className="flex items-center justify-between gap-2 h-7 pl-1 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
        onClick={() => {
          if (props.collapsible) {
            setIsExpanded(prev => !prev);
          }
        }}
      >
        {props.icon && (
          <props.icon className={cn('h-5 w-5 transition-transform shrink-0')} />
        )}
        <span
          className={cn('font-medium text-sm flex-1', !props.icon && 'pl-2')}
        >
          {props.title}
        </span>
        <div onClick={e => e.stopPropagation()}>
          {typeof props.actions === 'function'
            ? props.actions(isExpanded)
            : props.actions ||
              (props.collapsible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted-foreground/10 p-0"
                  onClick={() => {
                    setIsExpanded(prev => !prev);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              ))}
        </div>
      </div>
      {!props.closed && isExpanded && (
        <div className="relative">{props.children}</div>
      )}
    </section>
  );
};
