import { useViewManager, setViewManager } from "@/hooks/app/useViewManager";
import { cn } from "@/lib/utils";
import { WORKSPACE_NAV_ITEMS } from "@/components/docs/constants";
import { useTranslation } from "react-i18next";

export const WorkspaceSettingsSidebar = () => {
  const { t } = useTranslation();
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "basic";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-2 space-y-1">
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
      </div>
    </div>
  );
};
