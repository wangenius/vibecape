/**
 * Chat Quote Event
 * 用于将文档选区内容发送到 Chat 输入框
 */

export interface QuoteEventDetail {
  text: string;
  docId?: string;
  docTitle?: string;
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
