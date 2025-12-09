/**
 * Agent 类型定义（前后端共享）
 */

/** 多语言系统提示词 */
export interface BilingualSystem {
  "en": string;
  "zh": string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string | BilingualSystem;
  isDefault?: boolean;
}

/** 根据语言获取系统提示词 */
export function getSystemPrompt(
  prompt: string | BilingualSystem,
  language: "en" | "zh" = "en"
): string {
  if (typeof prompt === "string") {
    return prompt;
  }
  return prompt[language] || prompt["en"];
}
