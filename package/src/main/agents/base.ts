/**
 * Agent 基类
 * 封装 AI SDK Agent 的通用逻辑
 */

import {
  Experimental_Agent as AIAgent,
  stepCountIs,
  tool,
  type LanguageModel,
} from "ai";
import type { AgentConfig, AgentMeta, AgentModule } from "./types";
import { getSystemPrompt } from "@common/types/agent";

export { tool };

/**
 * 创建 Agent 模块的工厂函数
 */
export function defineAgent(
  meta: AgentMeta,
  config: AgentConfig
): AgentModule {
  return {
    meta,
    getConfig: () => config,
    createAgent: (model: LanguageModel, language: "en-US" | "zh-CN" = "en-US") => {
      return new AIAgent({
        model,
        system: getSystemPrompt(config.system, language),
        tools: config.tools ?? {},
        stopWhen: stepCountIs(config.maxSteps ?? 20),
        toolChoice: config.toolChoice ?? "auto",
      });
    },
  };
}

/**
 * 从 AgentModule 获取兼容旧接口的 Agent 对象
 */
export function toAgent(module: AgentModule) {
  return {
    ...module.meta,
    systemPrompt: module.getConfig().system,
  };
}
