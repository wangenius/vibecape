import { useViewManager, setViewManager } from "@/hook/app/useViewManager";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS } from "./constants";

export const SettingsSidebar = () => {
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";

  return (
    <div className="h-full w-[360px] flex flex-col bg-accent overflow-hidden pt-10">
      <div className="p-3">
        <div className="text-sm font-medium">设置</div>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {SETTINGS_NAV_ITEMS.map((item) => {
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
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
