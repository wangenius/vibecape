import { TaskManager } from "@/pages/header/TaskManager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { TbBook, TbSettings, TbPlanet } from "react-icons/tb";
import {
  useViewManager,
  switchTab,
  closeTab,
  toggleBayBar,
  setViewManager,
  type ViewProps,
} from "@/hook/app/useViewManager";
import { ModelSelector } from "./ModelSelector";
import {
  BsLayoutSidebar,
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
  BsLayoutSidebarReverse,
  BsX,
} from "react-icons/bs";
import { motion } from "framer-motion";

/**
 * 获取标签图标
 */
const getTabIcon = (type: ViewProps["type"]) => {
  switch (type) {
    case "cosmos":
      return TbPlanet;
    case "novel":
      return TbBook;
    case "settings":
      return TbSettings;
    case "parsebook":
      return TbBook;
    default:
      return TbPlanet;
  }
};

export function Header() {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );

  const isBayBarOpen = useViewManager((selector) => selector.isBayBarOpen);

  const { tabs: allTabs, activeTabId } = useViewManager();

  // 过滤掉预览模式的 cosmos 标签，保留详情模式的标签
  const tabs = allTabs.filter((tab) => {
    // 如果是 cosmos 类型且是预览模式（overview），则不显示
    if (tab.type === "cosmos" && tab.meta?.view === "overview") {
      console.log("Filtering out overview tab:", tab.id);
      return false;
    }
    // 其他情况都显示（包括 cosmos detail 模式）
    if (tab.type === "cosmos") {
      console.log("Keeping detail tab:", tab.id, "meta:", tab.meta);
    }
    return true;
  });

  const toggleSidebar = () => {
    setViewManager({ isSidebarCollapsed: !isSidebarCollapsed });
  };

  return (
    <header
      id="body-header"
      className="flex items-center bg-transparent pr-1 pl-20 h-8 flex-none"
    >
      <motion.div
        id="sidebar-header"
        className="flex-none"
        initial={false}
        animate={{
          width: isSidebarCollapsed ? 28 : 336,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
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
      </motion.div>
      {/* 中间：标签列表 + 拖拽区域 */}
      <div
        id="viewport-header"
        className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden"
      >
        {/* 标签列表 */}
        {tabs.length > 0 && (
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-hide px-0 h-full">
            {tabs.map((tab) => (
              <TabItem key={tab.id} tab={tab} activeTabId={activeTabId} />
            ))}
          </div>
        )}
        {/* 拖拽区域 */}
        <div id="header-drag-region" className="flex-1 h-full"></div>
      </div>

      {/* 右侧：模型选择器 + 任务管理 + AI对话 */}
      <div
        id="baybar-header"
        className="flex items-center gap-1 flex-none pr-1"
      >
        <TaskManager />
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
      </div>
    </header>
  );
}

function TabItem({
  tab,
  activeTabId,
}: {
  tab: ViewProps;
  activeTabId: string | null;
}) {
  const isActive = tab.id === activeTabId;
  const Icon = getTabIcon(tab.type);
  const handleSwitchTab = useCallback((tabId: string) => {
    console.log("切换标签:", tabId);
    switchTab(tabId);
  }, []);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  }, []);

  return (
    <div
      key={tab.id}
      onClick={() => handleSwitchTab(tab.id)}
      style={
        {
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties
      }
      className={cn(
        "group relative flex items-center gap-2 pl-3 pr-3 h-7 rounded-none text-[13px] font-medium transition-colors duration-200 cursor-default select-none border-r border-border/10 overflow-hidden shrink-0",
        tab.closable ? "pr-7" : "pr-3",
        isActive
          ? "bg-muted/40 text-foreground"
          : "bg-transparent text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
      <Icon
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          isActive ? "text-primary" : "opacity-70 group-hover:opacity-100"
        )}
      />
      <span className="truncate max-w-40 leading-none pb-px">{tab.title}</span>
      {tab.closable && (
        <div
          onClick={(e) => handleCloseTab(e, tab.id)}
          className={cn(
            "absolute right-1.5 size-4 flex items-center justify-center rounded-md hover:bg-foreground/10 cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100"
          )}
        >
          <BsX className="size-3.5" />
        </div>
      )}
    </div>
  );
}
