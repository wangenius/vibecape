/**
 * Tiptap 内容类型定义
 * 使用 JSON 对象存储（结构化数据，便于解析和操作）
 */

import type { EditorContent } from "@common/types/content";

// 编辑器内容类型：直接使用 JSON 对象
export type TiptapContent = EditorContent;

// 默认内容：空段落的 JSON 表示
export const DEFAULT_TIPTAP_CONTENT: TiptapContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};
