import { ReactNode } from "react";

interface SettingsContainerProps {
  children: ReactNode;
}

export const SettingsContainer = ({ children }: SettingsContainerProps) => (
  <div className="flex flex-col gap-6">{children}</div>
);

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
  <section className="flex flex-col gap-3">
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
    <div className="flex flex-col gap-1">{children}</div>
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
  <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
      <span className="text-sm text-foreground">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

interface SettingCardProps {
  children: ReactNode;
  className?: string;
}

export const SettingCard = ({ children, className = "" }: SettingCardProps) => (
  <div
    className={`p-4 rounded-lg bg-muted/30 border border-border/50 flex flex-col gap-3 ${className}`}
  >
    {children}
  </div>
);

interface SettingListProps {
  children: ReactNode;
  empty?: ReactNode;
}

export const SettingList = ({ children, empty }: SettingListProps) => {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : Boolean(children);

  if (!hasChildren && empty) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return <div className="flex flex-col gap-1">{children}</div>;
};

interface ListItemProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ListItem = ({
  icon,
  title,
  subtitle,
  badges,
  actions,
  status,
  className = "",
  onClick,
}: ListItemProps) => (
  <div
    className={`flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{title}</span>
          {badges}
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {status}
      {actions}
    </div>
  </div>
);

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    error: "bg-red-500/10 text-red-600",
    info: "bg-blue-500/10 text-blue-600",
  };

  return (
    <span
      className={`px-1.5 py-0.5 text-xs rounded font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  status?: "available" | "planned";
}

export const FeatureCard = ({
  icon,
  title,
  description,
  shortcut,
  status = "available",
}: FeatureCardProps) => (
  <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
    <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border border-border font-mono">
            {shortcut}
          </kbd>
        )}
        <Badge variant={status === "available" ? "success" : "warning"}>
          {status === "available" ? "可用" : "计划中"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

interface ShortcutItemProps {
  shortcut: string;
  label: string;
}

export const ShortcutItem = ({ shortcut, label }: ShortcutItemProps) => (
  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20">
    <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono min-w-12 text-center">
      {shortcut}
    </kbd>
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

export const InfoRow = ({ label, children }: InfoRowProps) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{children}</span>
  </div>
);
