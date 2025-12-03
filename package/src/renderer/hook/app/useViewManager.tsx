/**
 * 视图管理器 - 整合原 View 和 TabManager
 * 统一管理所有视图状态、标签页、侧边栏等
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================== 类型定义 ====================

/**
 * 视口类型
 */
export type ViewType =
  | "cosmos" // 项目/世界观详情
  | "novel" // 小说/作品编辑（包含章节）
  | "settings" // 设置页面
  | "parsebook" // 拆书页面
  | "stats"; // 统计页面

/**
 * 侧边栏面板类型 - 统一所有侧边栏可显示的面板
 */
export type SidebarSection =
  | "story" // 情节
  | "actant" // 角色
  | "lore" // 设定
  | "search" // 搜索
  | "opus" // 作品列表
  | "settings" // 设置
  | "plugins" // 插件
  | "parsebook" // 拆书
  | "cosmos" // 项目列表
  | "meta"; // 世界观信息

/**
 * 侧边栏视图模式 - 文档树或目录
 */
export type SidebarViewMode = "tree" | "toc";

/**
 * 视口接口
 */
export interface ViewProps {
  /** 标签唯一ID，由 type + contentId 组成 */
  id: string;
  /** 标签类型 */
  type: ViewType;
  /** 内容ID（如 cosmosId, chapterId 等） */
  contentId?: string;
  /** 显示标题 */
  title: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 额外数据 */
  meta?: Record<string, any>;
  /** 创建时间 */
  createdAt: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
}

/**
 * 实体类型枚举
 */
export enum EntityKind {
  STORY = "story",
  ACTANT = "actant",
  LORE = "lore",
}

/**
 * 视图管理状态接口
 */
export interface ViewManagerState {
  // ========== 标签页管理 ==========
  /** 所有打开的标签 */
  tabs: ViewProps[];
  /** 当前激活的标签ID */
  activeTabId: string | null;
  /** 最大标签数量 */
  maxTabs: number;

  // ========== 侧边栏状态 ==========
  /** 当前激活的侧边栏面板 */
  activeSidebarPanel: SidebarSection;
  /** 左侧边栏折叠状态 */
  isSidebarCollapsed: boolean;
  /** 右侧聊天面板是否打开 */
  isBayBarOpen: boolean;

  // ========== 筛选和预览 ==========
  /** 角色筛选类型 */
  actantFilter: "all" | string;
  /** 设定筛选类型 */
  loreFilter: "all" | string;
  /** 预览的项目ID（未打开项目时） */
  previewCosmosId: string | null;

  // ========== 侧边栏视图模式 ==========
  /** 侧边栏视图模式：tree=文档树, toc=目录 */
  sidebarViewMode: SidebarViewMode;

  // ========== 历史记录 ==========
  /**
   * 路由历史记录
   * 用于存储最近10条历史记录，支持返回功能
   */
  history: Array<Omit<ViewManagerState, "history">>;
}

/** 可更新的状态键类型（排除history） */
type UpdateKey = keyof Omit<ViewManagerState, "history">;

// ==================== Zustand Store ====================

interface ViewManagerStore extends ViewManagerState {
  /** 设置多个状态 */
  setState: (state: Partial<ViewManagerState>) => void;
  /** 更新单个状态键（会记录历史） */
  updateKey: <K extends UpdateKey>(key: K, value: ViewManagerState[K]) => void;
  /** 返回上一个状态 */
  goBack: () => void;

  // ========== 标签页操作 ==========
  /** 添加或切换到标签 */
  openTab: (
    tab: Omit<ViewProps, "id" | "createdAt" | "lastAccessedAt">
  ) => string;
  /** 关闭标签 */
  closeTab: (tabId: string) => void;
  /** 切换到指定标签 */
  switchTab: (tabId: string) => void;
  /** 关闭所有标签 */
  closeAllTabs: () => void;
  /** 关闭其他标签 */
  closeOtherTabs: (tabId: string) => void;
  /** 更新标签信息 */
  updateTab: (
    tabId: string,
    updates: Partial<Pick<ViewProps, "title" | "meta">>
  ) => void;
  /** 重新排序标签 */
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

/**
 * 生成标签ID
 */
const generateTabId = (type: ViewType, contentId?: string): string => {
  if (contentId) {
    return `${type}:${contentId}`;
  }
  return type;
};

/**
 * 创建视图管理器 Store
 */
const useViewManagerStore = create<ViewManagerStore>()(
  persist(
    (set, get) => ({
      // ========== 初始状态 ==========
      tabs: [],
      activeTabId: null,
      maxTabs: 20,
      activeSidebarPanel: "story",
      isSidebarCollapsed: false,
      isBayBarOpen: false,
      actantFilter: "all",
      loreFilter: "all",
      previewCosmosId: null,
      sidebarViewMode: "tree",
      history: [],

      // ========== 基础状态操作 ==========
      setState: (newState) => set((state) => ({ ...state, ...newState })),

      updateKey: (key, value) =>
        set((state) => {
          // 添加历史记录
          const { history, ...rest } = state;
          const newHistory = [
            ...history,
            rest as Omit<ViewManagerState, "history">,
          ].slice(-10);
          return {
            ...state,
            [key]: value,
            history: newHistory,
          };
        }),

      goBack: () =>
        set((state) => {
          const { history } = state;
          if (history.length === 0) return state;
          const lastState = history[history.length - 1];
          return {
            ...lastState,
            history: history.slice(0, -1),
          };
        }),

      // ========== 标签页操作 ==========
      openTab: (tabData) => {
        const now = Date.now();
        const tabId = generateTabId(tabData.type, tabData.contentId);

        const existingTab = get().tabs.find((t) => t.id === tabId);

        if (existingTab) {
          // 标签已存在，更新访问时间、标题、closable属性和meta
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    lastAccessedAt: now,
                    title: tabData.title,
                    closable: tabData.closable ?? t.closable,
                    meta: tabData.meta ?? t.meta, // 更新 meta 字段
                  }
                : t
            ),
            activeTabId: tabId,
          }));
          return tabId;
        }

        // 创建新标签
        const newTab: ViewProps = {
          ...tabData,
          id: tabId,
          closable: tabData.closable ?? true,
          createdAt: now,
          lastAccessedAt: now,
        };

        set((state) => {
          let newTabs = [...state.tabs, newTab];

          // 如果超过最大标签数，关闭最早访问的可关闭标签
          if (newTabs.length > state.maxTabs) {
            const closableTabs = newTabs
              .filter((t) => t.closable)
              .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

            if (closableTabs.length > 0) {
              const tabToClose = closableTabs[0];
              newTabs = newTabs.filter((t) => t.id !== tabToClose.id);
            }
          }

          return {
            tabs: newTabs,
            activeTabId: tabId,
          };
        });

        return tabId;
      },

      closeTab: (tabId) => {
        set((state) => {
          const closingIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (closingIndex === -1) return state;

          const newTabs = state.tabs.filter((t) => t.id !== tabId);

          // 如果关闭的是当前标签，需要切换到其他标签
          let newActiveTabId = state.activeTabId;
          if (state.activeTabId === tabId) {
            if (newTabs.length > 0) {
              // 优先切换到右侧标签，没有则切换到左侧
              if (closingIndex < newTabs.length) {
                newActiveTabId = newTabs[closingIndex].id;
              } else {
                newActiveTabId = newTabs[newTabs.length - 1].id;
              }
            } else {
              newActiveTabId = null;
            }
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      switchTab: (tabId) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab) return;

        set({
          activeTabId: tabId,
          tabs: get().tabs.map((t) =>
            t.id === tabId ? { ...t, lastAccessedAt: Date.now() } : t
          ),
        });
      },

      closeAllTabs: () => {
        set((state) => ({
          tabs: state.tabs.filter((t) => !t.closable),
          activeTabId: null,
        }));
      },

      closeOtherTabs: (tabId) => {
        set((state) => ({
          tabs: state.tabs.filter((t) => t.id === tabId || !t.closable),
          activeTabId: tabId,
        }));
      },

      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, ...updates } : t
          ),
        }));
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, movedTab);
          return { tabs: newTabs };
        });
      },
    }),
    {
      name: "view_manager_state",
      version: 1,
    }
  )
);

// ==================== Hooks ====================

/** 使用视图管理器（支持 selector） */
export function useViewManager<T = ViewManagerStore>(
  selector?: (state: ViewManagerStore) => T
): T {
  return useViewManagerStore(selector ?? ((state) => state as T));
}

/** 使用所有标签 */
export function useTabs() {
  return useViewManagerStore((state) => state.tabs);
}

/** 使用当前激活的标签 */
export function useActiveTab() {
  return useViewManagerStore((state) => {
    const { tabs, activeTabId } = state;
    return tabs.find((t) => t.id === activeTabId) || null;
  });
}

/** 使用激活的标签ID */
export function useActiveTabId() {
  return useViewManagerStore((state) => state.activeTabId);
}

/** 使用侧边栏面板 */
export function useActiveSidebarPanel() {
  return useViewManagerStore((state) => state.activeSidebarPanel);
}

/** 使用BayBar状态 */
export function useIsBayBarOpen() {
  return useViewManagerStore((state) => state.isBayBarOpen);
}

// ==================== 工具函数 ====================

/** 获取当前视图管理器状态（非响应式） */
export function getCurrentViewManager() {
  return useViewManagerStore.getState();
}

// ==================== 视图管理器操作函数 ====================

/** 设置状态 */
export function setViewManager(state: Partial<ViewManagerState>) {
  useViewManagerStore.getState().setState(state);
}

/** 返回上一个路由状态 */
export function goBack() {
  useViewManagerStore.getState().goBack();
}

// ========== 标签页管理 ==========

/**
 * 打开项目/世界观概览页（预览模式）
 */
export function openCosmosTab(cosmosId?: string, title: string = "世界观") {
  return useViewManagerStore.getState().openTab({
    type: "cosmos",
    contentId: cosmosId,
    title,
    closable: true,
    meta: { view: "overview" },
  });
}

// Cosmos-related functions removed for docs app

/**
 * 打开小说/作品编辑页面
 */
export function openNovelTab(novelId: string, title: string) {
  return useViewManagerStore.getState().openTab({
    type: "novel",
    contentId: novelId,
    title,
    closable: true,
  });
}

/**
 * 打开设置页面
 * 所有设置类型共用一个"设置"标签，通过 meta.settingsType 区分不同的设置页面
 */
export function openSettingsTab(settingsType?: string) {
  return useViewManagerStore.getState().openTab({
    type: "settings",
    // 不使用 contentId，让所有设置共用一个标签ID
    title: "设置",
    closable: true,
    meta: { settingsType: settingsType || "general" },
  });
}

/**
 * 打开拆书页面
 */
export function openParseBookTab(fileId: string, fileName: string) {
  return useViewManagerStore.getState().openTab({
    type: "parsebook",
    contentId: fileId,
    title: fileName,
    closable: true,
    meta: { fileId },
  });
}

/**
 * 打开统计页面
 */
export function openStatsTab() {
  return useViewManagerStore.getState().openTab({
    type: "stats",
    title: "数据统计",
    closable: true,
  });
}

/**
 * 关闭标签
 */
export function closeTab(tabId: string) {
  useViewManagerStore.getState().closeTab(tabId);
}

/**
 * 切换标签
 */
export function switchTab(tabId: string) {
  useViewManagerStore.getState().switchTab(tabId);
}

/**
 * 更新标签标题
 */
export function updateTabTitle(tabId: string, title: string) {
  useViewManagerStore.getState().updateTab(tabId, { title });
}

/**
 * 关闭所有标签
 */
export function closeAllTabs() {
  useViewManagerStore.getState().closeAllTabs();
}

/**
 * 关闭其他标签
 */
export function closeOtherTabs(tabId: string) {
  useViewManagerStore.getState().closeOtherTabs(tabId);
}

// ========== 侧边栏管理 ==========

/**
 * 切换侧边栏面板
 * 只切换面板，不自动打开tab
 */
export function switchSidebarPanel(panel: SidebarSection) {
  updateViewManagerKey("activeSidebarPanel", panel);
}

/**
 * 切换右侧聊天面板
 */
export function toggleBayBar() {
  const current = useViewManagerStore.getState().isBayBarOpen;
  updateViewManagerKey("isBayBarOpen", !current);
}

/**
 * 打开右侧聊天面板
 */
export function openBayBar() {
  updateViewManagerKey("isBayBarOpen", true);
}

/**
 * 关闭右侧聊天面板
 */
export function closeBayBar() {
  updateViewManagerKey("isBayBarOpen", false);
}

/**
 * 关闭所有标签页和右侧聊天面板
 * 用于关闭世界观时清理所有相关视图
 */
export function closeAllTabsAndBayBar() {
  useViewManagerStore.getState().closeAllTabs();
  updateViewManagerKey("isBayBarOpen", false);
}

/**
 * 折叠/展开左侧边栏
 */
export function toggleLeftSidebar() {
  const current = useViewManagerStore.getState().isSidebarCollapsed;
  updateViewManagerKey("isSidebarCollapsed", !current);
}

// ========== 项目管理 ==========

/**
 * 设置预览项目ID
 */
export function setPreviewCosmos(id: string | null) {
  updateViewManagerKey("previewCosmosId", id);
}

// ========== 筛选器管理 ==========

/**
 * 设置角色筛选
 */
export function setActantFilter(filter: "all" | string) {
  updateViewManagerKey("actantFilter", filter);
}

/**
 * 设置设定筛选
 */
export function setLoreFilter(filter: "all" | string) {
  updateViewManagerKey("loreFilter", filter);
}

/**
 * 切换侧边栏视图模式
 */
export function toggleSidebarViewMode() {
  const current = useViewManagerStore.getState().sidebarViewMode;
  updateViewManagerKey("sidebarViewMode", current === "tree" ? "toc" : "tree");
}

/**
 * 设置侧边栏视图模式
 */
export function setSidebarViewMode(mode: SidebarViewMode) {
  updateViewManagerKey("sidebarViewMode", mode);
}

// ========== 辅助函数 ==========

function updateViewManagerKey<K extends UpdateKey>(
  key: K,
  value: ViewManagerState[K]
) {
  useViewManagerStore.getState().updateKey(key, value);
}
