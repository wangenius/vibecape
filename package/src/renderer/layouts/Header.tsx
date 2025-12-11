import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useViewManager,
  setViewManager,
  toggleBayBar,
} from "@/hooks/app/useViewManager";
import { useRepositoryStore } from "@/hooks/stores";
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

  const repository = useRepositoryStore((state) => state.repository);
  const repositoryList = useRepositoryStore((state) => state.repositoryList);
  const openRepository = useRepositoryStore((state) => state.openRepository);

  const repositoryName = repository?.config?.name || "";

  const handleSwitchRepository = async (id: string) => {
    try {
      await openRepository(id);
      setIsRepoPopoverOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleSidebar = () => {
    setViewManager({ isSidebarCollapsed: !isSidebarCollapsed });
  };

  console.log(repositoryName);

  return (
    <header className="flex items-center bg-transparent pr-xs pl-20 h-size-md flex-none select-none border-b w-full h-8 z-50 pointer-events-auto">
      <div className="flex-none flex items-center gap-xs">
        <Button
          size="icon"
          onClick={toggleSidebar}
          actived={!isSidebarCollapsed}
          title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {isSidebarCollapsed ? <BsLayoutSidebar /> : <BsLayoutSidebarInset />}
        </Button>
      </div>

      {/* 中间：拖拽区域 */}
      <div className="header-drag-region flex-1 h-full" />

      {/* 工作区名称 */}
      {repositoryName && (
        <Popover open={isRepoPopoverOpen} onOpenChange={setIsRepoPopoverOpen}>
          <PopoverTrigger asChild>
            <Button>
              <span className="truncate">{repositoryName}</span>
              <TbChevronDown className="size-icon-xs shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-xs" align="center" sideOffset={8}>
            {repositoryList.length === 0 ? (
              <div className="py-md text-center text-sm text-muted-foreground">
                暂无其他工作区
              </div>
            ) : (
              repositoryList.map((item) => (
                <Button
                  key={item.id}
                  size="full"
                  actived={repository?.id === item.id}
                  onClick={() => void handleSwitchRepository(item.id)}
                >
                  <TbFolder />
                  <span>{item.name}</span>
                </Button>
              ))
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* 拖拽区域 */}
      <div className="header-drag-region flex-1 h-full" />

      {/* 右侧：模型选择器 + AI对话 + 设置 */}
      <div className="flex items-center gap-1 flex-none pr-2">
        <ModelSelector />
        <Button size="icon" onClick={() => openSettingsDialog()}>
          <TbSettings />
        </Button>
        <Button
          size="icon"
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
