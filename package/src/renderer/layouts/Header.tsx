import { useState } from "react";
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
import { TbSettings, TbChevronDown, TbFolder } from "react-icons/tb";
import { ModelSelector } from "../components/custom/ModelSelector";
import { ViewModeSwitch } from "./sidebar/ViewModeSwitch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export function Header() {
  const [isRepoPopoverOpen, setIsRepoPopoverOpen] = useState(false);
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
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace);

  const isSettingsMode = activeSidebarPanel === "settings";
  const workspaceName = workspace?.config?.name || "";

  const handleSwitchWorkspace = async (id: string) => {
    try {
      await openWorkspace(id);
      setIsRepoPopoverOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

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
        {/* 工作区名称 - 点击切换 */}
        {workspaceName && (
          <Popover open={isRepoPopoverOpen} onOpenChange={setIsRepoPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md",
                  "text-xs text-muted-foreground/60 hover:text-muted-foreground",
                  "hover:bg-muted transition-colors cursor-pointer",
                  "max-w-[200px] truncate"
                )}
              >
                <span className="truncate">{workspaceName}</span>
                <TbChevronDown className="size-3 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-1" align="center" sideOffset={8}>
              <div className="max-h-[300px] overflow-y-auto">
                {workspaceList.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    暂无其他工作区
                  </div>
                ) : (
                  workspaceList.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left",
                        "hover:bg-muted transition-colors cursor-pointer",
                        workspace?.id === item.id && "bg-muted"
                      )}
                      onClick={() => void handleSwitchWorkspace(item.id)}
                    >
                      <TbFolder className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">
                        {item.name}
                      </span>
                      {workspace?.id === item.id && (
                        <span className="text-xs text-muted-foreground">
                          当前
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
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
