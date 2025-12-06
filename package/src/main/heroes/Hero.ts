/**
 * Hero 基类 - 所有 Hero 的核心定义
 */

import {
  Experimental_Agent as AIAgent,
  stepCountIs,
  type LanguageModel,
  type Tool,
} from "ai";
import {
  normalizeLanguage,
  type LocaleLike,
  type BilingualPrompt,
  type Language,
} from "@common/types/hero";

/** Hero 配置选项 */
export interface HeroConfig {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: BilingualPrompt;
  /** 形象图标 (emoji 或图片路径) */
  avatar: string;
  /** 系统提示词 */
  prompt: BilingualPrompt;
  /** 工具集 */
  tools?: Record<string, Tool>;
  /** 最大步数 */
  maxSteps?: number;
  /** 工具选择策略 */
  toolChoice?:
    | "auto"
    | "required"
    | "none"
    | { type: "tool"; toolName: string };
  /** 是否为默认 Hero */
  isDefault?: boolean;
}

/** Hero 元数据（用于 UI 展示） */
export interface HeroMeta {
  id: string;
  name: string;
  description: BilingualPrompt;
  avatar: string;
  isDefault?: boolean;
}

/**
 * Hero 类 - 封装 AI SDK Agent 的创建和管理
 */
export class Hero {
  readonly id: string;
  readonly name: string;
  readonly description: BilingualPrompt;
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
  getSystemPrompt(language: LocaleLike = "en"): string {
    const lang = normalizeLanguage(language);
    const basePrompt = this.prompt[lang] || this.prompt.en;

    // 附加引用格式说明
    const refInstruction =
      lang === "zh"
        ? `
## 引用格式说明
用户可能会引用文档内容，格式为 JSON 包裹在 [REF] 标签中：
- 文档引用: [REF]{"type":"doc","docId":"...","docTitle":"..."}[/REF]
- 文本引用: [REF]{"type":"text","docId":"...","text":"...","position":{...},...}[/REF]

当看到文本引用时，你可以利用其中的 position 和 context 信息来精确定位和修改文档。
`
        : `
## Reference Format Instructions
Users may quote document content using JSON wrapped in [REF] tags:
- Document Ref: [REF]{"type":"doc","docId":"...","docTitle":"..."}[/REF]
- Text Ref: [REF]{"type":"text","docId":"...","text":"...","position":{...},...}[/REF]

When you see a text ref, you can use the position and context information within it to precisely locate and modify the document.
`;

    return `${basePrompt}\n${refInstruction}`;
  }

  /** 创建 AI SDK Agent 实例 */
  createAgent(
    model: LanguageModel,
    language: LocaleLike = "en"
  ): AIAgent<Record<string, Tool>> {
    const lang = normalizeLanguage(language);
    return new AIAgent({
      model,
      system: this.getSystemPrompt(lang),
      tools: this.tools,
      stopWhen: stepCountIs(this.maxSteps),
      toolChoice: this.toolChoice,
    });
  }
}

export type { BilingualPrompt, Language, LocaleLike };
