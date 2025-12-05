import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS } from "@/features/docs/constants";
import { useTranslation } from "react-i18next";

export const SettingsSidebar = () => {
  const { t } = useTranslation();
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";

  return (
    <div className="h-full w-[360px] flex flex-col border-r border-border overflow-hidden shrink-0 whitespace-nowrap">
      <div className="p-3">
        <div className="text-sm font-medium">
          {t("common.settings.settingsTitle")}
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.key;
          const labelKey = item.key === "storage" ? "cloudStorage" : item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setViewManager({ previewCosmosId: item.key });
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{t(`common.settings.${labelKey}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
