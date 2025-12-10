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
  <section>
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
  <div>
    <div className="flex flex-col gap-xs">
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
  <div>{children}</div>
);
