import { ReactNode } from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SettingsContainer = ({ children }: { children: ReactNode }) => {
  return <div className="space-y-6">{children}</div>;
};

export const SettingSection = ({
  title,
  description,
  action,
  children,
}: SettingSectionProps) => (
  <section className="space-y-2">
    <div>
      <header>
        <h2>{title}</h2>
        {description && <small>{description}</small>}
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
  <div className="flex items-center gap-2 justify-between">
    <div className="flex flex-col gap-2">
      <span className="text-label">{label}</span>
      {description && <p className="text-hint">{description}</p>}
    </div>
    {children}
  </div>
);

interface SettingCardProps {
  children: ReactNode;
}

export const SettingCard = ({ children }: SettingCardProps) => (
  <div className="p-4 border border-border rounded-lg">{children}</div>
);
