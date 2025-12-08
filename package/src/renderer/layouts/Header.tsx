import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useViewManager,
  setViewManager,
  toggleBayBar,
  setSidebarViewMode,
} from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import {
  BsLayoutSidebar,
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
  BsLayoutSidebarReverse,
} from "react-icons/bs";
import { TbSettings } from "react-icons/tb";
import { ModelSelector } from "../components/custom/ModelSelector";
import { ViewModeSwitch } from "./sidebar/ViewModeSwitch";

export function Header() {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const isBayBarOpen = useViewManager((selector) => selector.isBayBarOpen);
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const sidebarViewMode = useViewManager(
    (selector) => selector.sidebarViewMode
  );
  const workspace = useWorkspaceStore((state) => state.workspace);

  const isSettingsMode = activeSidebarPanel === "settings";
  const workspaceName = workspace?.config?.name || "";

  const toggleSidebar = () => {
    setViewManager({ isSidebarCollapsed: !isSidebarCollapsed });
  };

  const toggleSettings = () => {
    if (isSettingsMode) {
      setViewManager({ activeSidebarPanel: "story" });
    } else {
      setViewManager({
        activeSidebarPanel: "settings",
        isSidebarCollapsed: false,
      });
    }
  };

  return (
    <header
      id="body-header"
      className="flex items-center bg-transparent pr-1 pl-20 h-8 flex-none select-none border-b border-border"
    >
      <div className="flex-none flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "size-7 hover:bg-muted-foreground/10",
            isSidebarCollapsed
              ? "bg-transparent hover:bg-muted-foreground/10"
              : "bg-muted-foreground/10"
          )}
          title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {isSidebarCollapsed ? (
            <BsLayoutSidebar className="size-4" />
          ) : (
            <BsLayoutSidebarInset className="size-4" />
          )}
        </Button>
        {/* 视图模式切换（仅在有 workspace 且非设置模式时显示） */}
        {workspace && !isSettingsMode && (
          <ViewModeSwitch
            mode={sidebarViewMode}
            onModeChange={setSidebarViewMode}
          />
        )}
      </div>

      {/* 中间：工作区名称 + 拖拽区域 */}
      <div
        id="viewport-header"
        className="flex-1 flex items-center justify-center gap-2 min-w-0 overflow-hidden"
      >
        {/* 拖拽区域 */}
        <div id="header-drag-region" className="flex-1 h-full"></div>
        {/* 工作区名称 */}
        {workspaceName && (
          <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
            {workspaceName}
          </span>
        )}
        {/* 拖拽区域 */}
        <div id="header-drag-region-right" className="flex-1 h-full"></div>
      </div>

      {/* 右侧：模型选择器 + AI对话 + 设置 */}
      <div
        id="baybar-header"
        className="flex items-center gap-1 flex-none pr-1"
      >
        <ModelSelector />
        <Button
          variant="ghost"
          size="icon"
          aria-label="AI 对话"
          onClick={() => toggleBayBar()}
          className={cn(
            "size-7 hover:bg-muted-foreground/10",
            isBayBarOpen
              ? "bg-muted-foreground/10"
              : "bg-transparent hover:bg-muted-foreground/10"
          )}
        >
          {isBayBarOpen ? (
            <BsLayoutSidebarInsetReverse className="size-4" />
          ) : (
            <BsLayoutSidebarReverse className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSettings}
          className={cn(
            "size-7 hover:bg-muted-foreground/10",
            isSettingsMode && "bg-muted-foreground/10"
          )}
          title="设置"
        >
          <TbSettings className="size-4" />
        </Button>
      </div>
    </header>
  );
}
