import { cn } from "@/lib/utils";
import {
  useViewManager,
  switchSidebarPanel,
  type SidebarSection,
} from "@/hook/app/useViewManager";
import { SIDEBAR_PANELS } from "./Sidebar";

interface SideNavProps {
  topPanels: SidebarSection[];
  bottomPanels: SidebarSection[];
}

export const SideNav = ({ topPanels, bottomPanels }: SideNavProps) => {
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );

  const handleNavClick = (panel: SidebarSection) => {
    // 只切换sidebar面板，不打开view
    switchSidebarPanel(panel);
  };

  const renderNavButton = (panelType: SidebarSection) => {
    const panel = SIDEBAR_PANELS[panelType];
    const Icon = panel.icon;
    const isActive = activeSidebarPanel === panelType;

    return (
      <button
        key={panelType}
        onClick={() => handleNavClick(panelType)}
        className={cn(
          "flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium transition-colors",
          "rounded-md hover:bg-muted-foreground/10 size-8",
          isActive
            ? "bg-primary/10 hover:bg-primary/20 text-primary shadow-sm"
            : "text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex-none h-full overflow-hidden",
        isSidebarCollapsed && "pointer-events-none"
      )}
    >
      <div className="flex h-full flex-col w-10 gap-2 justify-between">
        {/* 顶部导航按钮 */}
        <div className="flex flex-col gap-1">
          {topPanels.map((panel) => renderNavButton(panel))}
        </div>
        {/* 底部导航按钮 */}
        <div className="flex flex-col gap-1">
          {bottomPanels.map((panel) => renderNavButton(panel))}
        </div>
      </div>
    </div>
  );
};
