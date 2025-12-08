/**
 * 聊天 API 类型定义
 * 使用 AI SDK v5 的原生类型
 */

import type { UIMessage } from "ai";

// Re-export AI SDK types for convenience
export type { UIMessage } from "ai";

// UIMessage 的 parts 类型
export type UIMessagePart = UIMessage["parts"][number];

// 流式请求负载
export interface ChatStreamPayload {
  id: string;
  thread: string;
  prompt: string;
  messages?: UIMessage[];
  heroId?: string;
  /** @deprecated 使用 heroId */
  agentId?: string;
}

// 内联编辑请求负载
export interface InlineEditPayload {
  id: string;
  instruction: string;
  selection: string;
  context?: {
    before: string;
    after: string;
  };
}
