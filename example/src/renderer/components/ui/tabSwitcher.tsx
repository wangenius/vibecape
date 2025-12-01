import { ReactNode } from 'react';

export const TabList = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground ${className}`}
    >
      {children}
    </div>
  );
};

export const TabTrigger = ({
  children,
  isSelected,
  onClick,
  icon,
}: {
  children: ReactNode;
  isSelected: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground'
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
