import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mention 历史记录 Store
 * 记录用户最近 @ 引用过的文档，用于智能排序
 */

const MAX_HISTORY_SIZE = 20;

type MentionHistoryItem = {
  id: string;
  title: string;
  timestamp: number;
};

type MentionHistoryState = {
  /** 最近引用过的文档列表（按时间倒序） */
  recentMentions: MentionHistoryItem[];
};

type MentionHistoryActions = {
  /** 记录一次 @ 引用 */
  recordMention: (id: string, title: string) => void;
  /** 获取文档的权重分数（用于排序） */
  getScore: (docId: string, activeDocId: string | null) => number;
  /** 清空历史记录 */
  clearHistory: () => void;
};

export const useMentionHistoryStore = create<
  MentionHistoryState & MentionHistoryActions
>()(
  persist(
    (set, get) => ({
      recentMentions: [],

      recordMention: (id, title) => {
        const { recentMentions } = get();

        // 移除已存在的记录（如果有）
        const filtered = recentMentions.filter((item) => item.id !== id);

        // 添加到开头
        const updated = [
          { id, title, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY_SIZE);

        set({ recentMentions: updated });
      },

      getScore: (docId, activeDocId) => {
        const { recentMentions } = get();

        // 当前打开的文档 - 最高优先级 (1000)
        if (activeDocId && docId === activeDocId) {
          return 1000;
        }

        // 最近 @ 过的文档 - 按时间衰减 (100-500)
        const mentionIndex = recentMentions.findIndex(
          (item) => item.id === docId
        );
        if (mentionIndex !== -1) {
          // 越新的权重越高：第1个500分，第20个100分
          return 500 - mentionIndex * 20;
        }

        // 其他文档 - 默认0分
        return 0;
      },

      clearHistory: () => {
        set({ recentMentions: [] });
      },
    }),
    {
      name: "mention_history",
      partialize: (state) => ({
        recentMentions: state.recentMentions,
      }),
    }
  )
);
