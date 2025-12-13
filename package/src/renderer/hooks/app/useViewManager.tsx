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
 * 侧边栏视图模式 - 文档树或目录
 */
export type SidebarViewMode = "tree" | "toc";

/**
 * 视图管理状态接口
 */
export interface ViewManagerState {
  /** 左侧边栏折叠状态 */
  isSidebarCollapsed: boolean;
  /** 右侧聊天面板是否打开 */
  isBayBarOpen: boolean;
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
}

/**
 * 创建视图管理器 Store
 */
const useViewManagerStore = create<ViewManagerStore>()(
  persist(
    (set) => ({
      activeTabId: null,
      isSidebarCollapsed: false,
      isBayBarOpen: false,
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
 * 折叠/展开左侧边栏
 */
export function toggleLeftSidebar() {
  const current = useViewManagerStore.getState().isSidebarCollapsed;
  updateViewManagerKey("isSidebarCollapsed", !current);
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
