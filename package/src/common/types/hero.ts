/**
 * Hero 类型定义（前后端共享）
 */

/** 多语言提示词 */
export interface BilingualPrompt {
  en: string;
  zh: string;
}

/** Hero 基础信息（用于 UI 展示） */
export interface HeroInfo {
  id: string;
  name: string;
  description: string;
  avatar: string;
  isDefault?: boolean;
}

/** 语言类型 */
export type Language = "en" | "zh";

/** 根据语言获取提示词 */
export function getPrompt(
  prompt: string | BilingualPrompt,
  language: Language = "en"
): string {
  if (typeof prompt === "string") {
    return prompt;
  }
  return prompt[language] || prompt.en;
}

// ============ 兼容旧接口 ============

/** @deprecated 使用 BilingualPrompt */
export interface BilingualSystem {
  "en-US": string;
  "zh-CN": string;
}

/** @deprecated 使用 HeroInfo */
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string | BilingualSystem;
  isDefault?: boolean;
}

/** @deprecated 使用 getPrompt */
export function getSystemPrompt(
  prompt: string | BilingualSystem,
  language: "en-US" | "zh-CN" = "en-US"
): string {
  if (typeof prompt === "string") {
    return prompt;
  }
  return prompt[language] || prompt["en-US"];
}
