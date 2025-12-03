/**
 * Hero 基类 - 所有 Hero 的核心定义
 */

import {
  Experimental_Agent as AIAgent,
  stepCountIs,
  type LanguageModel,
  type Tool,
} from "ai";

/** 多语言提示词 */
export interface BilingualPrompt {
  en: string;
  zh: string;
}

/** Hero 配置选项 */
export interface HeroConfig {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 形象图标 (emoji 或图片路径) */
  avatar: string;
  /** 系统提示词 */
  prompt: BilingualPrompt;
  /** 工具集 */
  tools?: Record<string, Tool>;
  /** 最大步数 */
  maxSteps?: number;
  /** 工具选择策略 */
  toolChoice?: "auto" | "required" | "none" | { type: "tool"; toolName: string };
  /** 是否为默认 Hero */
  isDefault?: boolean;
}

/** Hero 元数据（用于 UI 展示） */
export interface HeroMeta {
  id: string;
  name: string;
  description: string;
  avatar: string;
  isDefault?: boolean;
}

/** 语言类型 */
export type Language = "en" | "zh";

/**
 * Hero 类 - 封装 AI SDK Agent 的创建和管理
 */
export class Hero {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly avatar: string;
  readonly prompt: BilingualPrompt;
  readonly tools: Record<string, Tool>;
  readonly maxSteps: number;
  readonly toolChoice: HeroConfig["toolChoice"];
  readonly isDefault: boolean;

  constructor(config: HeroConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.avatar = config.avatar;
    this.prompt = config.prompt;
    this.tools = config.tools ?? {};
    this.maxSteps = config.maxSteps ?? 20;
    this.toolChoice = config.toolChoice ?? "auto";
    this.isDefault = config.isDefault ?? false;
  }

  /** 获取元数据 */
  getMeta(): HeroMeta {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatar: this.avatar,
      isDefault: this.isDefault,
    };
  }

  /** 根据语言获取系统提示词 */
  getSystemPrompt(language: Language = "en"): string {
    return this.prompt[language] || this.prompt.en;
  }

  /** 创建 AI SDK Agent 实例 */
  createAgent(model: LanguageModel, language: Language = "en"): AIAgent<Record<string, Tool>> {
    return new AIAgent({
      model,
      system: this.getSystemPrompt(language),
      tools: this.tools,
      stopWhen: stepCountIs(this.maxSteps),
      toolChoice: this.toolChoice,
    });
  }
}
