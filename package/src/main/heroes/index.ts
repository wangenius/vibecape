/**
 * Heroes 模块 - Hero 管理和导出
 */

import type { LanguageModel } from "ai";
import { Hero, type HeroConfig, type HeroMeta, type BilingualPrompt, type Language } from "./Hero";
import { HeroesManager } from "./HeroesManager";

// 导入预设 Heroes
import {
  assistant,
  writer,
  translator,
  coder,
  analyst,
  creative,
} from "./presets";

// 注册所有预设 Heroes
HeroesManager.registerAll([
  assistant,
  writer,
  translator,
  coder,
  analyst,
  creative,
]);

// ============ 导出 API ============

/** 获取所有 Hero 元数据（用于 UI 展示） */
export function getAllHeroMetas(): HeroMeta[] {
  return HeroesManager.getAllMetas();
}

/** 获取所有 Heroes */
export function getAllHeroes(): Hero[] {
  return HeroesManager.getAll();
}

/** 根据 ID 获取 Hero */
export function getHero(id: string): Hero | undefined {
  return HeroesManager.get(id);
}

/** 获取默认 Hero */
export function getDefaultHero(): Hero {
  return HeroesManager.getDefault();
}

/** 创建 AI SDK Agent 实例 */
export function createHeroAgent(id: string, model: LanguageModel, language: Language = "en") {
  return HeroesManager.createAgent(id, model, language);
}

// ============ 兼容旧接口 ============

/** @deprecated 使用 getAllHeroMetas */
export const getAllAgentMetas = getAllHeroMetas;

/** @deprecated 使用 getAllHeroes */
export const getAllAgents = getAllHeroes;

/** @deprecated 使用 getHero */
export const getAgent = getHero;

/** @deprecated 使用 getDefaultHero */
export const getDefaultAgent = getDefaultHero;

/** @deprecated 使用 createHeroAgent */
export const createAgentInstance = createHeroAgent;

// ============ 导出类型和类 ============

export { Hero, HeroesManager };
export type { HeroConfig, HeroMeta, BilingualPrompt, Language };

// 导出工具
export { commonTools } from "./tools";

// 导出预设 Heroes
export * from "./presets";
