import { ReactNode } from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SettingSection = ({
  title,
  description,
  action,
  children,
}: SettingSectionProps) => (
  <section className="space-y-4">
    <div className="flex items-end justify-between">
      <header>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <small className="text-sm text-muted-foreground mt-1">
            {description}
          </small>
        )}
      </header>
      {action}
    </div>
    {children}
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
  <div className="flex items-center justify-between gap-4 p-3 rounded-lg transition-colors">
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </div>
);

interface SettingCardProps {
  children: ReactNode;
}

export const SettingCard = ({ children }: SettingCardProps) => (
  <div className="rounded-lg bg-muted/30 p-4 space-y-4">{children}</div>
);

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export const SettingRow = ({
  label,
  description,
  children,
}: SettingRowProps) => (
  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </div>
);
