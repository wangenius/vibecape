/**
 * 标签内容渲染组件
 * 根据当前激活的标签渲染对应的内容（项目、章节、设置等）
 */

import { useViewManager, type ViewProps } from "@/hook/app/useViewManager";
import { memo, Suspense, useEffect } from "react";
import { useNovelStore } from "@/hook/novel/useNovel";
import { openNovel } from "@/hook/novel/useNovel";
import { ChapterPage } from "@/pages/viewport/novel/ChapterView";
import { ModelSettingsView } from "./setting/ModelSettingsView";
import { FeedbackView } from "./setting/FeedbackView";
import { ShortcutsView } from "./setting/ShortcutsView";
import { PrivacyPolicyView } from "./setting/PrivacyPolicyView";
import { AboutView } from "./setting/AboutView";
import { GeneralSettingsView } from "./setting/GeneralSettingsView";
import { NovelSettingsView } from "./setting/NovelSettingsView";
import { ParseBookPage } from "./parse/ParseBookPage";
import { CosmosDetailView } from "./cosmos/CosmosDetailView";
import { CosmosActantsFlowView } from "./cosmos/cosmos_actants_graph";
import { CosmosStoryGraphView } from "./cosmos/cosmos_story_graph";
  // import { CosmosStatsView } from "@plugins/jezz-stats/view";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { usePluginStore } from "@/PluginManager";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/**
 * 空状态组件
 */
const DefaultEmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        {/* Simplified Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
          <Sparkles
            className="relative w-12 h-12 text-muted-foreground/20"
            strokeWidth={1}
          />
        </div>

        <div className="space-y-2 text-center">
          <h3 className="text-sm font-medium text-foreground/70 tracking-widest">
            准备就绪
          </h3>
          <p className="text-xs text-muted-foreground/40 tracking-wider">
            按 <span className="font-mono">⌘ K</span> 唤起命令面板
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 主页空状态 - 空白
 */
const HomeEmptyState = () => {
  return <DefaultEmptyState />;
};

/**
 * 渲染单个标签内容
 */
const renderTabContent = (
  tab: ViewProps,
  pluginViews: Record<string, React.ComponentType<any>>
) => {
  switch (tab.type) {
    case "cosmos":
      // 世界观页面：根据 meta.view 决定显示概览、详情、统计或创建
      if (!tab.contentId) {
        return <DefaultEmptyState />;
      }

      const viewType = tab.meta?.view || "overview";

      if (viewType === "detail") {
        // 详情页面（编辑模式）
        return <CosmosDetailView key={tab.contentId || tab.id} />;
      } else if (viewType === "graph") {
        // 角色图谱视图
        return <CosmosActantsFlowView key={tab.contentId || tab.id} />;
      } else if (viewType === "story-graph") {
        // 剧情图谱视图
        return <CosmosStoryGraphView key={tab.contentId || tab.id} />;
      } else if (viewType === "stats") {
        // 统计数据页面 (From Plugin)
        const StatsView = pluginViews["stats"];
        if (StatsView) {
          return <StatsView key={tab.contentId || tab.id} />;
        }
        return <div>Plugin View Not Found: stats</div>;
      } else {
        // 概览页面或未打开时不显示内容
        return <HomeEmptyState />;
      }

    case "novel":
      // 小说编辑页（包含章节列表和编辑器）
      // 使用 key 强制为每个小说创建独立的组件实例
      return <ChapterPage key={tab.contentId || tab.id} />;

    case "settings":
      const settingsType = tab.meta?.settingsType || "general";

      // 需要滚动容器包装的设置页面
      const ScrollableView = ({ children }: { children: React.ReactNode }) => (
        <div className="h-full overflow-y-auto">{children}</div>
      );

      switch (settingsType) {
        case "models":
          return <ModelSettingsView />;
        case "novel":
          return (
            <ScrollableView>
              <NovelSettingsView />
            </ScrollableView>
          );
        case "feedback":
          return (
            <ScrollableView>
              <FeedbackView />
            </ScrollableView>
          );
        case "shortcuts":
          return (
            <ScrollableView>
              <ShortcutsView />
            </ScrollableView>
          );
        case "privacy":
          return (
            <ScrollableView>
              <PrivacyPolicyView />
            </ScrollableView>
          );
        case "about":
          return (
            <ScrollableView>
              <AboutView />
            </ScrollableView>
          );
        case "general":
        default:
          return (
            <ScrollableView>
              <GeneralSettingsView />
            </ScrollableView>
          );
      }

    case "parsebook":
      // 拆书页面
      if (!tab.contentId) {
        return <DefaultEmptyState />;
      }
      return <ParseBookPage fileId={tab.contentId} />;

    case "stats":
      // Standalone stats tab
      const StatsView = pluginViews["stats"];
      if (StatsView) {
        return <StatsView />;
      }
      return <DefaultEmptyState />;

    default:
      // Check if type matches a plugin view directly
      const PluginView = pluginViews[tab.type];
      if (PluginView) {
        return <PluginView />;
      }
      return <DefaultEmptyState />;
  }
};

/**
 * 标签内容组件
 */
export const Viewport = memo(() => {
  const activeTabId = useViewManager((state) => state.activeTabId);
  const activeTab = useViewManager((state) =>
    state.tabs.find((t) => t.id === state.activeTabId)
  );
  const currentCosmos = useCosmos((state) => state.current_meta);
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const pluginViews = usePluginStore((state) => state.views);

  // 当切换到小说标签时，自动加载对应的小说
  useEffect(() => {
    if (activeTab?.type === "novel" && activeTab.contentId) {
      // 只有当需要切换到不同的小说时才调用 open
      if (currentNovel?.id !== activeTab.contentId) {
        openNovel(activeTab.contentId).catch((err) => {
          console.error("Failed to open novel:", err);
        });
      }
    }
  }, [activeTab?.type, activeTab?.contentId, currentNovel?.id]);

  // 没有打开标签，或是世界观标签但当前没有打开任何世界观时，展示主页空状态
  // 如果是新建世界观页面 (meta.view === 'new')，则允许显示
  // 如果是预览页面 (meta.view === 'overview' 或 undefined)，也允许显示
  const viewType = activeTab?.meta?.view || "overview";
  if (
    !activeTab ||
    (!currentCosmos && activeTab.type === "cosmos" && viewType !== "overview")
  ) {
    return <HomeEmptyState />;
  }

  return (
    <div
      className="w-full h-full flex-1 overflow-hidden grow px-2 pb-2"
      key={activeTabId}
    >
      <div className="w-full h-full overflow-hidden grow rounded-lg">
        <Suspense fallback={<div>Loading...</div>}>
          {renderTabContent(activeTab, pluginViews)}
        </Suspense>
      </div>
    </div>
  );
});

Viewport.displayName = "TabContent";
