/**
 * AI SDK v5 消息部分类型定义
 * 用于前后端统一使用
 */

// 文本部分
export type TextPart = {
  type: "text";
  text: string;
  state?: "streaming" | "done";
};

// 推理/思考部分
export type ReasoningPart = {
  type: "reasoning";
  text: string;
  state?: "streaming" | "done";
};

// 工具调用状态
export type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

// 工具调用部分
export type ToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state: ToolState;
  input: unknown;
  output?: unknown;
  errorText?: string;
};

// 思考内容（reasoning + tool）
export type ThinkingPart = ReasoningPart | ToolPart;

// 所有消息部分的联合类型
export type MessagePart = TextPart | ReasoningPart | ToolPart;
