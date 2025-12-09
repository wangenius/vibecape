import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/core";

/**
 * Prompt Store
 * 管理用户自定义的 AI Prompt 模板
 */

const MAX_RECENT_SIZE = 10;

export interface PromptItem {
  /** 唯一标识 */
  id: string;
  /** Prompt 标题 */
  title: string;
  /** Prompt 内容 (JSONContent 格式) */
  body: JSONContent;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

interface PromptState {
  /** 所有 Prompt 列表 */
  prompts: PromptItem[];
  /** 最近使用的 Prompt ID 列表（按时间倒序） */
  recentPromptIds: string[];
}

interface PromptActions {
  /** 添加 Prompt */
  addPrompt: (title: string, body: JSONContent) => PromptItem;
  /** 更新 Prompt */
  updatePrompt: (id: string, updates: Partial<Pick<PromptItem, "title" | "body">>) => void;
  /** 删除 Prompt */
  deletePrompt: (id: string) => void;
  /** 记录使用 Prompt（更新最近使用列表） */
  recordUsage: (id: string) => void;
  /** 获取最近使用的 Prompts */
  getRecentPrompts: () => PromptItem[];
  /** 根据关键词搜索 Prompts */
  searchPrompts: (query: string) => PromptItem[];
  /** 获取 Prompt 的纯文本内容 */
  getPromptText: (id: string) => string;
}

/** 生成唯一 ID */
const generateId = () => `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** 从 JSONContent 提取纯文本 */
const extractTextFromJSON = (content: JSONContent): string => {
  if (!content) return "";
  
  let text = "";
  
  if (content.text) {
    text += content.text;
  }
  
  if (content.content && Array.isArray(content.content)) {
    for (const node of content.content) {
      const nodeText = extractTextFromJSON(node);
      if (nodeText) {
        // 段落之间添加换行
        if (text && node.type === "paragraph") {
          text += "\n";
        }
        text += nodeText;
      }
    }
  }
  
  return text;
};

export const usePromptStore = create<PromptState & PromptActions>()(
  persist(
    (set, get) => ({
      prompts: [],
      recentPromptIds: [],

      addPrompt: (title, body) => {
        const now = Date.now();
        const newPrompt: PromptItem = {
          id: generateId(),
          title,
          body,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          prompts: [...state.prompts, newPrompt],
        }));

        return newPrompt;
      },

      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: Date.now() }
              : p
          ),
        }));
      },

      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          recentPromptIds: state.recentPromptIds.filter((pid) => pid !== id),
        }));
      },

      recordUsage: (id) => {
        set((state) => {
          // 移除已存在的记录
          const filtered = state.recentPromptIds.filter((pid) => pid !== id);
          // 添加到开头
          const updated = [id, ...filtered].slice(0, MAX_RECENT_SIZE);
          return { recentPromptIds: updated };
        });
      },

      getRecentPrompts: () => {
        const { prompts, recentPromptIds } = get();
        return recentPromptIds
          .map((id) => prompts.find((p) => p.id === id))
          .filter((p): p is PromptItem => p !== undefined);
      },

      searchPrompts: (query) => {
        const { prompts, recentPromptIds } = get();
        const searchStr = query.toLowerCase().trim();

        if (!searchStr) {
          // 无搜索词时，按最近使用排序
          const recentSet = new Set(recentPromptIds);
          const recent = recentPromptIds
            .map((id) => prompts.find((p) => p.id === id))
            .filter((p): p is PromptItem => p !== undefined);
          const others = prompts.filter((p) => !recentSet.has(p.id));
          return [...recent, ...others];
        }

        // 搜索标题和内容
        return prompts.filter((p) => {
          const titleMatch = p.title.toLowerCase().includes(searchStr);
          const bodyText = extractTextFromJSON(p.body).toLowerCase();
          const bodyMatch = bodyText.includes(searchStr);
          return titleMatch || bodyMatch;
        });
      },

      getPromptText: (id) => {
        const { prompts } = get();
        const prompt = prompts.find((p) => p.id === id);
        if (!prompt) return "";
        return extractTextFromJSON(prompt.body);
      },
    }),
    {
      name: "prompt_store",
      partialize: (state) => ({
        prompts: state.prompts,
        recentPromptIds: state.recentPromptIds,
      }),
    }
  )
);
