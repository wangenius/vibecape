/**
 * Agent 管理模块
 */

import type { LanguageModel } from "ai";
import { toAgent } from "./base";
import type { Agent, AgentId, AgentModule, AgentMeta } from "./types";

// 导入预设 Agents
import {
  assistantAgent,
  writerAgent,
  translatorAgent,
  coderAgent,
  analystAgent,
  creativeAgent,
} from "./presets";

// 所有预设 Agent 模块
const agentModules: AgentModule[] = [
  assistantAgent,
  writerAgent,
  translatorAgent,
  coderAgent,
  analystAgent,
  creativeAgent,
];

// Agent 模块索引
const moduleMap = new Map<AgentId, AgentModule>(
  agentModules.map((m) => [m.meta.id, m])
);

/**
 * 获取所有 Agent 元数据（用于 UI 展示）
 */
export function getAllAgentMetas(): AgentMeta[] {
  return agentModules.map((m) => m.meta);
}

/**
 * 获取所有 Agents（兼容旧接口）
 */
export function getAllAgents(): Agent[] {
  return agentModules.map(toAgent);
}

/**
 * 根据 ID 获取 Agent 模块
 */
export function getAgentModule(id: AgentId): AgentModule | undefined {
  return moduleMap.get(id);
}

/**
 * 根据 ID 获取 Agent（兼容旧接口）
 */
export function getAgent(id: AgentId): Agent | undefined {
  const module = moduleMap.get(id);
  return module ? toAgent(module) : undefined;
}

/**
 * 获取默认 Agent 模块
 */
export function getDefaultAgentModule(): AgentModule {
  return agentModules.find((m) => m.meta.isDefault) || agentModules[0];
}

/**
 * 获取默认 Agent（兼容旧接口）
 */
export function getDefaultAgent(): Agent {
  return toAgent(getDefaultAgentModule());
}

/**
 * 创建 AI SDK Agent 实例
 */
export function createAgentInstance(id: AgentId, model: LanguageModel) {
  const module = moduleMap.get(id);
  if (!module) {
    throw new Error(`Agent ${id} 不存在`);
  }
  return module.createAgent(model);
}

// 导出类型
export type { Agent, AgentId, AgentMeta, AgentModule, AgentConfig, BilingualSystem } from "./types";

// 导出辅助函数
export { getSystemPrompt } from "@common/types/agent";

// 导出工具函数
export { defineAgent, tool, toAgent } from "./base";

// 导出预设 Agents
export * from "./presets";
