/**
 * Agent 类型定义
 */

import type {
  Experimental_Agent as AIAgent,
  LanguageModel,
  Tool,
} from "ai";
import type { BilingualSystem } from "@common/types/agent";

export type { BilingualSystem };

/** Agent 元数据（用于 UI 展示） */
export interface AgentMeta {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 形象图标 (emoji 或图片路径) */
  avatar: string;
  /** 是否为默认 Agent */
  isDefault?: boolean;
}

/** Agent 配置选项 */
export interface AgentConfig {
  /** 系统提示词（支持字符串或多语言对象） */
  system: string | BilingualSystem;
  /** 工具集 */
  tools?: Record<string, Tool>;
  /** 最大步数 */
  maxSteps?: number;
  /** 工具选择策略 */
  toolChoice?: "auto" | "required" | "none" | { type: "tool"; toolName: string };
}

/** Agent 模块接口 */
export interface AgentModule {
  /** 元数据 */
  meta: AgentMeta;
  /** 获取配置 */
  getConfig(): AgentConfig;
  /** 创建 AI SDK Agent 实例 */
  createAgent(model: LanguageModel, language?: "en-US" | "zh-CN"): AIAgent<Record<string, Tool>>;
}

export type AgentId = string;

// 兼容旧接口
export interface Agent extends AgentMeta {
  systemPrompt: string | BilingualSystem;
}
