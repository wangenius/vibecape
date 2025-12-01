import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useViewManager, toggleLeftSidebar } from "@/hook/app/useViewManager";
import { CosmosRequiredPlaceholder } from "@/pages/sidebar/cosmos/CosmosRequiredPlaceholder";
import { SIDEBAR_PANELS } from "./Sidebar";
import { useCosmos } from "@/hook/cosmos/useCosmos";

export const SideSection = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );

  const currentCosmos = useCosmos((state) => state.current_meta);

  const toggleSidebar = () => {
    toggleLeftSidebar();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 使用 Ctrl+B 来切换 Sidebar
      if (e.key.toLowerCase() === "b" && e.ctrlKey && !e.shiftKey) {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderContent = () => {
    // 需要世界观但当前未打开时，显示占位
    const panel = SIDEBAR_PANELS[activeSidebarPanel];
    if (panel?.needsCosmos && !currentCosmos) {
      return <CosmosRequiredPlaceholder />;
    }

    // 显示当前激活的面板内容
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {panel.content}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex-none h-full overflow-hidden",
        isSidebarCollapsed && "pointer-events-none"
      )}
    >
      <div className="h-full w-[360px] flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
