/**
 * HeroesManager - Hero 注册和管理
 */

import type { LanguageModel } from "ai";
import { Hero, type HeroMeta, type Language } from "./Hero";

/**
 * Hero 管理器 - 单例模式
 */
class HeroesManagerClass {
  private heroes = new Map<string, Hero>();
  private defaultHeroId: string | null = null;

  /** 注册一个 Hero */
  register(hero: Hero): this {
    this.heroes.set(hero.id, hero);
    if (hero.isDefault) {
      this.defaultHeroId = hero.id;
    }
    return this;
  }

  /** 批量注册 Heroes */
  registerAll(heroes: Hero[]): this {
    heroes.forEach((hero) => this.register(hero));
    return this;
  }

  /** 获取所有 Hero */
  getAll(): Hero[] {
    return Array.from(this.heroes.values());
  }

  /** 获取所有 Hero 元数据 */
  getAllMetas(): HeroMeta[] {
    return this.getAll().map((hero) => hero.getMeta());
  }

  /** 根据 ID 获取 Hero */
  get(id: string): Hero | undefined {
    return this.heroes.get(id);
  }

  /** 获取默认 Hero */
  getDefault(): Hero {
    if (this.defaultHeroId) {
      const hero = this.heroes.get(this.defaultHeroId);
      if (hero) return hero;
    }
    // 返回第一个 Hero 作为默认
    const first = this.heroes.values().next().value;
    if (!first) {
      throw new Error("No heroes registered");
    }
    return first;
  }

  /** 创建 AI SDK Agent 实例 */
  createAgent(id: string, model: LanguageModel, language: Language = "en") {
    const hero = this.heroes.get(id);
    if (!hero) {
      throw new Error(`Hero "${id}" not found`);
    }
    return hero.createAgent(model, language);
  }

  /** 检查 Hero 是否存在 */
  has(id: string): boolean {
    return this.heroes.has(id);
  }

  /** 获取 Hero 数量 */
  get size(): number {
    return this.heroes.size;
  }
}

/** 全局 HeroesManager 实例 */
export const HeroesManager = new HeroesManagerClass();
