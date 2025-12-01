import { useEffect } from "react";
import { create } from "zustand";
import type { ChatThreadMeta } from "@common/schema/chat";
import { useChatStore } from "./useChat";

const THREAD_STORAGE_KEY = "jezzlab.ai.thread";

interface ThreadState {
  // 状态
  activeChatId: string | undefined;
  historyLoading: boolean;
  threadList: ChatThreadMeta[];
  initialized: boolean;
  isInitializing: boolean; // 是否正在初始化

  // Actions
  setActiveChatId: (id: string | undefined) => void;
  setHistoryLoading: (loading: boolean) => void;
  setThreadList: (list: ChatThreadMeta[]) => void;

  // 业务方法
  _initialize: () => Promise<void>; // 内部方法，自动调用
  refreshThreads: (limit?: number) => Promise<void>;
  selectThread: (targetThreadId?: string) => Promise<void>;
  createNewThread: () => Promise<void>;
}

export const useThreadStore = create<ThreadState>((set, get) => ({
  // 初始状态
  activeChatId: undefined,
  historyLoading: false,
  threadList: [],
  initialized: false,
  isInitializing: false,

  setActiveChatId: (id) => {
    set({ activeChatId: id });
    // 保存到 localStorage
    if (typeof window !== "undefined" && id) {
      window.localStorage.setItem(THREAD_STORAGE_KEY, id);
    }
  },

  setHistoryLoading: (loading) => set({ historyLoading: loading }),
  setThreadList: (list) => set({ threadList: list }),

  /**
   * 内部初始化方法：从 localStorage 加载或创建新对话
   * 自动调用，确保全局只初始化一次
   */
  _initialize: async () => {
    if (get().initialized) {
      console.log("[useThread] 已初始化，跳过");
      return;
    }

    console.log("[useThread] 开始初始化...");
    set({ initialized: true, isInitializing: true });

    try {
      // 从 localStorage 读取
      let savedThreadId: string | undefined;
      if (typeof window !== "undefined") {
        savedThreadId =
          window.localStorage?.getItem(THREAD_STORAGE_KEY) || undefined;
      }

      const loadHistoryMessages = useChatStore.getState().loadHistoryMessages;

      if (savedThreadId) {
        // 有保存的对话 ID，加载历史消息
        console.log("[useThread] 加载保存的对话:", savedThreadId);
        get().setActiveChatId(savedThreadId);
        await loadHistoryMessages(savedThreadId);
      } else {
        // 没有保存的对话，创建新对话
        console.log("[useThread] 创建新对话");
        await get().createNewThread();
      }

      console.log("[useThread] 初始化完成");
    } finally {
      set({ isInitializing: false });
    }
  },

  /**
   * 刷新对话列表
   */
  refreshThreads: async (limit?: number) => {
    try {
      set({ historyLoading: true });
      const list = await window.api.chat.list({ limit });
      set({ threadList: list });
    } catch (error) {
      console.error("[useThread] 加载对话线程列表失败", error);
    } finally {
      set({ historyLoading: false });
    }
  },

  /**
   * 选择对话（切换到已有对话或创建新对话）
   */
  selectThread: async (targetThreadId?: string) => {
    if (targetThreadId) {
      // 切换到已有对话
      console.log("[useThread] 切换到对话:", targetThreadId);
      get().setActiveChatId(targetThreadId);

      // 加载历史消息（如果 store 中没有）
      const loadHistoryMessages = useChatStore.getState().loadHistoryMessages;
      await loadHistoryMessages(targetThreadId);
    } else {
      // 创建新对话
      await get().createNewThread();
    }

    // 刷新对话列表
    try {
      await get().refreshThreads();
    } catch (error) {
      console.error("[useThread] 刷新对话列表失败", error);
    }
  },

  /**
   * 创建新对话
   */
  createNewThread: async () => {
    try {
      console.log("[useThread] 创建新对话...");
      const newThread = await window.api.chat.create();
      console.log("[useThread] 新对话已创建:", newThread.id);
      get().setActiveChatId(newThread.id);
    } catch (error) {
      console.error("[useThread] 创建新对话失败", error);
      // 如果创建失败，使用临时 ID 作为后备
      const tempId = `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      get().setActiveChatId(tempId);
    }
  },
}));

/**
 * 使用对话线程管理的 Hook
 * 自动初始化，确保全局只初始化一次
 */
export function useThread() {
  const activeChatId = useThreadStore((state) => state.activeChatId);
  const historyLoading = useThreadStore((state) => state.historyLoading);
  const threadList = useThreadStore((state) => state.threadList);
  const initialized = useThreadStore((state) => state.initialized);
  const isInitializing = useThreadStore((state) => state.isInitializing);

  const _initialize = useThreadStore((state) => state._initialize);
  const refreshThreads = useThreadStore((state) => state.refreshThreads);
  const selectThread = useThreadStore((state) => state.selectThread);

  // 自动初始化：确保全局只执行一次
  useEffect(() => {
    if (!initialized) {
      void _initialize();
    }
  }, [initialized, _initialize]);

  return {
    // 状态
    activeChatId,
    historyLoading,
    threadList,
    isInitializing,

    // Actions
    refreshThreads,
    selectThread,
  };
}
