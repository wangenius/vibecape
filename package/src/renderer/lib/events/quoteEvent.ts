/**
 * Chat Quote Event
 * 用于将文档选区内容发送到 Chat 输入框
 *
 * 增强版：提供完整的结构化位置信息，便于 AI 精确修改
 */

export interface QuotePosition {
  /** 选区起始位置（字符偏移量） */
  from: number;
  /** 选区结束位置（字符偏移量） */
  to: number;
}

export interface QuoteContext {
  /** 选区前的文本（最多 200 字符） */
  before: string;
  /** 选区后的文本（最多 200 字符） */
  after: string;
}

export interface QuoteEventDetail {
  /** 选中的文本内容 */
  text: string;
  /** 文档 ID */
  docId?: string;
  /** 文档标题 */
  docTitle?: string;
  /** 选区位置信息 */
  position?: QuotePosition;
  /** 上下文信息（选区前后的文本） */
  context?: QuoteContext;
  /** 选区所在段落的完整文本 */
  paragraph?: string;
  /** 选区在段落中的位置 */
  paragraphOffset?: number;
}

/** 发送引用事件 */
export const dispatchQuoteEvent = (detail: QuoteEventDetail) => {
  const event = new CustomEvent<QuoteEventDetail>("chat:quote", { detail });
  window.dispatchEvent(event);
};

/** 监听引用事件 */
export const addQuoteListener = (
  callback: (detail: QuoteEventDetail) => void
) => {
  const handler = (e: CustomEvent<QuoteEventDetail>) => callback(e.detail);
  window.addEventListener("chat:quote", handler as EventListener);
  return () =>
    window.removeEventListener("chat:quote", handler as EventListener);
};

/**
 * 格式化引用信息为 AI 可理解的字符串
 * 用于在 Chat 中显示或发送给 AI
 */
export const formatQuoteForAI = (detail: QuoteEventDetail): string => {
  const lines: string[] = [];

  // 文档信息
  if (detail.docId) {
    lines.push(`📄 文档: ${detail.docTitle || "未命名"} (ID: ${detail.docId})`);
  }

  // 选中文本
  lines.push(`📝 选中内容:`);
  lines.push("```");
  lines.push(detail.text);
  lines.push("```");

  // 上下文信息
  if (detail.context) {
    if (detail.context.before) {
      lines.push(`📍 前文: ...${detail.context.before.slice(-100)}`);
    }
    if (detail.context.after) {
      lines.push(`📍 后文: ${detail.context.after.slice(0, 100)}...`);
    }
  }

  // 位置信息（供 AI 使用搜索替换）
  if (detail.paragraph) {
    lines.push(
      `📋 所在段落: "${detail.paragraph.slice(0, 100)}${detail.paragraph.length > 100 ? "..." : ""}"`
    );
  }

  return lines.join("\n");
};
