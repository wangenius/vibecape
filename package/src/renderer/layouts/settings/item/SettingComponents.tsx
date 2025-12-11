import { ReactNode } from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SettingsContainer = ({ children }: { children: ReactNode }) => {
  return <div className="space-y-8">{children}</div>;
};

export const SettingSection = ({
  title,
  description,
  action,
  children,
}: SettingSectionProps) => (
  <section className="space-y-4">
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div className="space-y-3">{children}</div>
  </section>
);

interface SettingItemProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export const SettingItem = ({
  label,
  description,
  children,
}: SettingItemProps) => (
  <div className="flex items-center justify-between gap-4 py-3 px-4 transition-colors">
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

interface SettingCardProps {
  children: ReactNode;
}

export const SettingCard = ({ children }: SettingCardProps) => (
  <div className="p-5 bg-card border border-border/50 rounded-xl space-y-3">
    {children}
  </div>
);
