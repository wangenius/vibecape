import { useEffect, useMemo, type ComponentType } from "react";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import {
  useViewManager,
  setPreviewCosmos,
  type SidebarSection,
} from "@/hook/app/useViewManager";
import { motion } from "framer-motion";
import {
  TbBook2,
  TbMoodNeutral,
  TbPuzzle,
  TbScript,
  TbSearch,
  TbSettings,
  TbSwipe,
  TbBookUpload,
  TbPlanet,
  TbLayoutGrid,
} from "react-icons/tb";
import { ActantListSection } from "./actant/ActantListSection";
import { LoreListSection } from "./lore/LoreListSection";
import { SearchSection } from "./search/SearchSection";
import { StoryListSection } from "./story/StoryListSection";
import { OpusListSection } from "./opus/OpusListSection";
import { SettingsSection } from "@/pages/sidebar/settings/SettingsSection";
import { PluginListSection } from "./plugin/PluginListSection";
import { FileListSection } from "./files/FileListSection";
import { CosmosMetaSection } from "./meta/CosmosMetaSection";
import { SideNav } from "./SideNav";
import { SideSection } from "./SideSection";

// 侧边栏面板配置
export const SIDEBAR_PANELS: Record<
  SidebarSection,
  {
    name: string;
    icon: ComponentType<{ className?: string }>;
    content: React.ReactNode;
    needsCosmos?: boolean; // 是否需要项目才能显示
  }
> = {
  story: {
    name: "情节",
    icon: TbScript,
    content: <StoryListSection />,
    needsCosmos: true,
  },
  actant: {
    name: "角色",
    icon: TbMoodNeutral,
    content: <ActantListSection />,
    needsCosmos: true,
  },
  lore: {
    name: "设定",
    icon: TbSwipe,
    content: <LoreListSection />,
    needsCosmos: true,
  },
  search: {
    name: "搜索",
    icon: TbSearch,
    content: <SearchSection />,
    needsCosmos: true,
  },
  opus: {
    name: "作品",
    icon: TbBook2,
    content: (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-3 py-3">
          <OpusListSection />
        </div>
      </div>
    ),
    needsCosmos: true,
  },
  settings: {
    name: "设置",
    icon: TbSettings,
    content: <SettingsSection />,
  },
  plugins: {
    name: "插件",
    icon: TbPuzzle,
    content: <PluginListSection />,
  },
  parsebook: {
    name: "拆书",
    icon: TbBookUpload,
    content: <FileListSection />,
  },
  cosmos: {
    name: "世界观",
    icon: TbPlanet,
    content: null, // 在renderContent中动态渲染
  },
  meta: {
    name: "信息",
    icon: TbLayoutGrid,
    content: <CosmosMetaSection />,
    needsCosmos: true,
  },
};

export const Sidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const previewCosmosId = useViewManager(
    (selector) => selector.previewCosmosId
  );
  const cosmos = useCosmos((state) => state.current_meta);
  const hasCosmos = Boolean(cosmos?.id);
  const cosmosList = useCosmos((state) => state.meta_list);

  const sortedCosmosIds = useMemo(() => {
    return Object.values(cosmosList)
      .sort((a, b) => b.updated_at - a.updated_at)
      .map((item) => item.id);
  }, [cosmosList]);

  useEffect(() => {
    if (hasCosmos) {
      if (previewCosmosId) {
        setPreviewCosmos(null);
      }
      return;
    }

    if (sortedCosmosIds.length === 0) {
      if (previewCosmosId) {
        setPreviewCosmos(null);
      }
      return;
    }

    if (!previewCosmosId || !cosmosList[previewCosmosId]) {
      setPreviewCosmos(sortedCosmosIds[0]);
    }
  }, [hasCosmos, previewCosmosId, sortedCosmosIds, cosmosList]);

  // 导航项配置：无论是否打开世界观都保持一致
  const topNavPanels: SidebarSection[] = [
    "story",
    "actant",
    "lore",
    "search",
    "opus",
    "meta",
  ];

  const bottomNavPanels: SidebarSection[] = [
    "parsebook",
    "plugins",
    "settings",
  ];

  return (
    <motion.div
      id="creator-sidebar"
      initial={false}
      animate={{
        width: isSidebarCollapsed ? "0px" : "calc(4rem + 360px)",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="h-full flex select-none overflow-hidden"
    >
      <div className="h-full flex bg-accent overflow-hidden p-2 pt-10">
        <SideNav topPanels={topNavPanels} bottomPanels={bottomNavPanels} />
        <SideSection />
      </div>
    </motion.div>
  );
};
