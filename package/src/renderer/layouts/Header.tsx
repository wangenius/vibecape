import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useViewManager,
  setViewManager,
  toggleBayBar,
} from "@/hooks/app/useViewManager";
import { useWorkspaceStore } from "@/hooks/stores";
import {
  BsLayoutSidebar,
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
  BsLayoutSidebarReverse,
} from "react-icons/bs";
import { TbSettings, TbChevronDown, TbFolder } from "react-icons/tb";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { openSettingsDialog } from "./settings";
import { ModelSelector } from "@/layouts/settings/item/ModelSelector";

export function Header() {
  const [isRepoPopoverOpen, setIsRepoPopoverOpen] = useState(false);
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const isBayBarOpen = useViewManager((selector) => selector.isBayBarOpen);

  const workspace = useWorkspaceStore((state) => state.workspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace);

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
          actived={isSidebarCollapsed}
          title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {isSidebarCollapsed ? <BsLayoutSidebar /> : <BsLayoutSidebarInset />}
        </Button>
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
              <Button>
                <span className="truncate">{workspaceName}</span>
                <TbChevronDown className="size-3 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-1" align="center" sideOffset={8}>
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {workspaceList.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    暂无其他工作区
                  </div>
                ) : (
                  workspaceList.map((item) => (
                    <Button
                      key={item.id}
                      size="full"
                      actived={workspace?.id === item.id}
                      onClick={() => void handleSwitchWorkspace(item.id)}
                    >
                      <TbFolder className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{item.name}</span>
                    </Button>
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
          onClick={() => openSettingsDialog()}
          title="设置"
        >
          <TbSettings />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="AI 对话"
          onClick={() => toggleBayBar()}
          actived={isBayBarOpen}
        >
          {isBayBarOpen ? (
            <BsLayoutSidebarInsetReverse />
          ) : (
            <BsLayoutSidebarReverse />
          )}
        </Button>
      </div>
    </header>
  );
}
