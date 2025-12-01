import type { JSONContent } from "@tiptap/core";

/**
 * 通用编辑器内容类型
 * 与 Tiptap 的 JSONContent 保持一致，便于前后端共享
 */
export type EditorContent = JSONContent;

/** Cosmos 标签定义 */
export type CosmosTag = {
  label: string;
  value: string;
  group: string;
};
