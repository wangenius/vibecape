/**
 * TiptapProse - 文本处理工具（JSON 版本）
 * 用于处理 Tiptap 编辑器的 JSON 内容
 */

import type { EditorContent } from "@common/types/content";
import { TiptapContent } from "./tiptap-types";

// 默认空内容
export const DEFAULT_CONTENT: TiptapContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

/**
 * TiptapProse 工具类
 * 提供 JSON 内容的处理方法
 */
export const TiptapProse = {
  /**
   * 将 Tiptap JSON 内容转换为纯文本
   * 递归提取所有文本节点
   */
  flatten(content: TiptapContent): string {
    if (!content) return "";

    // 如果是文本节点，直接返回文本
    if (content.text) {
      return content.text;
    }

    // 如果有子节点，递归处理
    if (content.content && Array.isArray(content.content)) {
      return content.content
        .map((node) => TiptapProse.flatten(node))
        .join(content.type === "paragraph" ? "\n" : "");
    }

    return "";
  },

  /**
   * 将纯文本转换为 Tiptap JSON 格式
   */
  fromText(text: string): TiptapContent {
    if (!text) return DEFAULT_CONTENT;

    // 将双换行符转换为段落分隔
    const paragraphs = text.split("\n\n").filter((p) => p.trim());

    if (paragraphs.length === 0) return DEFAULT_CONTENT;

    return {
      type: "doc",
      content: paragraphs.map((p) => {
        const lines = p.split("\n");
        const content: EditorContent[] = [];

        lines.forEach((line, index) => {
          if (line) {
            content.push({ type: "text", text: line });
          }
          // 在非最后一行后添加换行符
          if (index < lines.length - 1) {
            content.push({ type: "hardBreak" });
          }
        });

        return {
          type: "paragraph",
          content: content.length > 0 ? content : [],
        };
      }),
    };
  },
};

// 扩展 String 原型（可选）
declare global {
  interface String {
    toTiptapContent(): TiptapContent;
    chunking(count: number): string[];
    download(name: string): void;
  }
}

String.prototype.toTiptapContent = function (): TiptapContent {
  return TiptapProse.fromText(this.toString());
};

String.prototype.chunking = function (count: number): string[] {
  const text = this.toString();
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += count) {
    chunks.push(text.slice(i, i + count));
  }
  return chunks;
};

String.prototype.download = function (name: string): void {
  const blob = new Blob([this.toString()], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
