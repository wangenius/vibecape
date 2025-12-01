/**
 * Chapter - 章节管理 Slice
 */

import { DEFAULT_TIPTAP_CONTENT } from "@/components/editor/tiptap-types";
import { gen } from "@common/lib/generator";
import type { Chapter, ChapterInsert } from "@common/schema/novel";
import { getCurrentNovel } from "./useNovel";

// ==================== 类型定义 ====================

export interface ChapterSlice {
  chapters: Chapter[];
  currentChapterIndex: number;
  setChapters: (
    chapters: Chapter[] | ((prevChapters: Chapter[]) => Chapter[])
  ) => void;
  setCurrentChapterIndex: (index: number) => void;
  /** 插入章节到指定位置（同步更新本地状态，异步保存到后端） */
  insertChapter: (index?: number) => void;
  updateChapterByIndex: (index: number, updates: Partial<Chapter>) => void;
  updateChapterById: (id: string, updates: Partial<Chapter>) => void;
  removeChapterByIndex: (index: number) => void;
  removeChapterById: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createChapterSlice = (set: any, _get: any): ChapterSlice => ({
  chapters: [],
  currentChapterIndex: 0,

  setChapters: (
    chapters: Chapter[] | ((prevChapters: Chapter[]) => Chapter[])
  ) =>
    set((state: ChapterSlice) => {
      const newChapters =
        typeof chapters === "function" ? chapters(state.chapters) : chapters;
      return { chapters: newChapters };
    }),

  setCurrentChapterIndex: (index) =>
    set(() => ({
      currentChapterIndex: index,
    })),

  insertChapter: (index?: number) => {
    const novel = getCurrentNovel();
    if (!novel) return;
    
    // 先更新本地状态，确保UI立即响应
    // 默认插入到末尾
    set((state: ChapterSlice) => {
      const chapters = [...state.chapters];
      const insertIndex = index !== undefined ? index : chapters.length;
      
      const newChapter = createChapterInstance({
        novel_id: novel.id,
        order_index: insertIndex,
      });
      
      chapters.splice(insertIndex, 0, newChapter);
      
      // 异步保存到后端
      window.api.novel.chapter.create(novel.id, newChapter).catch((error) => {
        console.error("[Chapter] 创建章节失败:", error);
      });
      
      return { chapters };
    });
  },
  updateChapterByIndex: (index, updates) =>
    set((state: ChapterSlice) => {
      if (index < 0 || index >= state.chapters.length) return {};
      const chapters = [...state.chapters];
      chapters[index] = {
        ...chapters[index],
        ...updates,
      };
      return { chapters };
    }),

  updateChapterById: (id, updates) =>
    set((state: ChapterSlice) => {
      const index = state.chapters.findIndex((c) => c.id === id);
      if (index === -1) return {};
      const chapters = [...state.chapters];
      chapters[index] = {
        ...chapters[index],
        ...updates,
      };
      return { chapters };
    }),

  removeChapterByIndex: (index) =>
    set((state: ChapterSlice) => {
      if (index < 0 || index >= state.chapters.length) return {};
      const chapters = [...state.chapters];
      chapters.splice(index, 1);

      // 更新当前章节索引
      let newIndex = state.currentChapterIndex;
      if (state.currentChapterIndex === index) {
        newIndex = Math.max(0, index - 1);
      } else if (state.currentChapterIndex > index) {
        newIndex = state.currentChapterIndex - 1;
      }

      return {
        chapters,
        currentChapterIndex: newIndex,
      };
    }),

  removeChapterById: (id) =>
    set((state: ChapterSlice) => {
      const index = state.chapters.findIndex((c) => c.id === id);
      if (index === -1) return {};

      // 使用 removeChapterByIndex 的逻辑
      const chapters = [...state.chapters];
      chapters.splice(index, 1);

      let newIndex = state.currentChapterIndex;
      if (state.currentChapterIndex === index) {
        newIndex = Math.max(0, index - 1);
      } else if (state.currentChapterIndex > index) {
        newIndex = state.currentChapterIndex - 1;
      }

      return {
        chapters,
        currentChapterIndex: newIndex,
      };
    }),
});

// ==================== 工具函数 ====================

/** 创建新的章节实例 */
export function createChapterInstance(props?: Partial<ChapterInsert>): Chapter {
  const defaultChapter: Chapter = {
    id: gen.id(),
    novel_id: props?.novel_id || "",
    name: props?.name || "",
    story_id: props?.story_id || "",
    reasoner: props?.reasoner || "",
    body: props?.body || DEFAULT_TIPTAP_CONTENT,
    order_index: props?.order_index || 0,
    created_at: props?.created_at || Date.now(),
    updated_at: Date.now(),
  };

  return { ...defaultChapter, ...props };
}

/** 从 Tiptap JSON 中提取纯文本 */
function extractTextFromTiptap(node: any): string {
  if (!node) return "";
  
  // 如果是文本节点
  if (node.type === "text") {
    return node.text || "";
  }
  
  // 如果有子节点
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptap).join("");
  }
  
  return "";
}

/** 获取章节字数 */
export function getChapterWordCount(chapter: Chapter): number {
  const body = chapter.body;
  
  if (!body) return 0;
  
  // 如果是 Tiptap JSON 格式
  if (typeof body === "object" && body.type === "doc") {
    const text = extractTextFromTiptap(body);
    return text.trim().length;
  }
  
  // 兼容旧的 HTML 格式
  if (typeof body === "string") {
    const div = document.createElement("div");
    div.innerHTML = body;
    const text = div.textContent || div.innerText || "";
    return text.trim().length;
  }
  
  return 0;
}
