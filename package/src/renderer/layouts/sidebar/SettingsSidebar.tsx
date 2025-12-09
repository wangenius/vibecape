import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { cn } from "@/lib/utils";
import {
  SETTINGS_NAV_ITEMS,
  WORKSPACE_NAV_ITEMS,
} from "@/components/docs/constants";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/hooks/stores";

export const SettingsSidebar = () => {
  const { t } = useTranslation();
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";
  const workspace = useWorkspaceStore((state) => state.workspace);

  return (
    <div className="h-full w-[360px] flex flex-col border-r border-border overflow-hidden shrink-0 whitespace-nowrap">
      <div className="p-3">
        <div className="text-sm font-medium">
          {t("common.settings.settingsTitle")}
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Repo Settings - 仅当有 workspace 时显示 */}
        {workspace && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("common.settings.repoSettings")}
            </div>
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key;
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
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
            <div className="my-2 border-t border-border" />
          </>
        )}

        {/* App Settings */}
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("common.settings.appSettings")}
        </div>
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.key;
          const labelKey =
            item.key === "storage"
              ? "cloudStorage"
              : item.key === "ai"
                ? "aiLabel"
                : item.key;
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
