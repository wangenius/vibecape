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
