/**
 * Novel Meta - 小说元数据管理 Slice
 */

import type { Novel } from "@common/schema/novel";

// ==================== 类型定义 ====================

export interface NovelMetaSlice {
  currentNovel: Novel | null;
  novelList: Record<string, Novel>;
  setCurrentNovel: (novel: Novel | null) => void;
  setNovelList: (list: Record<string, Novel>) => void;
  updateNovelMeta: (updater: (novel: Novel) => Novel) => void;
}

// ==================== Slice Creator ====================

export const createNovelMetaSlice = (set: any): NovelMetaSlice => ({
  currentNovel: null,
  novelList: {},

  setCurrentNovel: (novel) => set(() => ({ currentNovel: novel })),

  setNovelList: (list) => set(() => ({ novelList: list })),

  updateNovelMeta: (updater) =>
    set((state: NovelMetaSlice) => ({
      currentNovel: state.currentNovel ? updater(state.currentNovel) : null,
    })),
});

