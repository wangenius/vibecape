/**
 * Hero 类型定义（前后端共享）
 */

/** 多语言提示词 */
export interface BilingualPrompt {
  en: string;
  zh: string;
}

export type LocaleLike = "en" | "zh";

export function normalizeLanguage(language: LocaleLike = "en"): "en" | "zh" {
  if (language === "zh") return "zh";
  return "en";
}

/** Hero 基础信息（用于 UI 展示） */
export interface HeroInfo {
  id: string;
  name: string;
  description: BilingualPrompt;
  avatar: string;
  isDefault?: boolean;
}

/** 语言类型 */
export type Language = "en" | "zh";

/** 根据语言获取提示词 */
export function getPrompt(
  prompt: string | BilingualPrompt,
  language: LocaleLike = "en"
): string {
  if (typeof prompt === "string") {
    return prompt;
  }
  const lang = normalizeLanguage(language);
  return prompt[lang] || prompt.en;
}

// ============ 兼容旧接口 ============

/** @deprecated 使用 BilingualPrompt */
export interface BilingualSystem {
  en: string;
  zh: string;
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
  language: "en" | "zh" = "en"
): string {
  if (typeof prompt === "string") {
    return prompt;
  }
  return prompt[language] || prompt["en"];
}
