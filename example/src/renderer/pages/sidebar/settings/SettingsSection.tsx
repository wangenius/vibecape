import React from "react";
import { cn } from "@/lib/utils";
import {
  TbSettings,
  TbBox,
  TbMessageCircle,
  TbKeyboard,
  TbShield,
  TbInfoCircle,
  TbBook,
} from "react-icons/tb";
import { useViewManager, openSettingsTab } from "@/hook/app/useViewManager";

interface SettingsSidebarProps {
  onClose?: () => void;
}

type SettingsNavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: SettingsNavItem[] = [
  { key: "general", label: "通用", icon: TbSettings },
  { key: "models", label: "模型", icon: TbBox },
  { key: "novel", label: "小说", icon: TbBook },
  { key: "feedback", label: "反馈", icon: TbMessageCircle },
  { key: "shortcuts", label: "快捷键", icon: TbKeyboard },
  { key: "privacy", label: "隐私政策", icon: TbShield },
  { key: "about", label: "关于", icon: TbInfoCircle },
];

export const SettingsSection: React.FC<SettingsSidebarProps> = () => {
  const activeTabId = useViewManager((state) => state.activeTabId);
  const tabs = useViewManager((state) => state.tabs);

  const currentSettingsType = React.useMemo(() => {
    if (!activeTabId || !activeTabId.includes("settings")) {
      return null;
    }
    const activeTab = tabs.find((t) => t.id === activeTabId);
    return activeTab?.meta?.settingsType || null;
  }, [activeTabId, tabs]);

  const handleNavClick = (settingsType: string) => {
    openSettingsTab(settingsType);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 flex-none items-center px-4">
        <span className="text-sm font-medium">设置</span>
      </div>

      <div className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentSettingsType === item.key ||
            (!currentSettingsType && item.key === "general");
          return (
            <div
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={cn(
                "w-full flex h-10 items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
