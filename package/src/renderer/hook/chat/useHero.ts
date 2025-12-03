import { useEffect } from "react";
import { create } from "zustand";
import type { HeroInfo } from "@common/api/chat";

const HERO_STORAGE_KEY = "jezzlab.ai.hero";

interface HeroState {
  // 所有可用的 Heroes
  heroes: HeroInfo[];
  // 当前选中的 Hero ID
  currentHeroId: string;
  // 是否已加载
  loaded: boolean;

  // Actions
  setHeroes: (heroes: HeroInfo[]) => void;
  setCurrentHeroId: (id: string) => void;
  loadHeroes: () => Promise<void>;
}

export const useHeroStore = create<HeroState>((set, get) => ({
  heroes: [],
  currentHeroId: "assistant", // 默认使用通用助手
  loaded: false,

  setHeroes: (heroes) => set({ heroes }),

  setCurrentHeroId: (id) => {
    set({ currentHeroId: id });
    // 保存到 localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HERO_STORAGE_KEY, id);
    }
  },

  loadHeroes: async () => {
    if (get().loaded) return;

    try {
      // 从后端加载 Heroes
      const heroes = await window.api.chat.heroes();
      set({ heroes, loaded: true });

      // 从 localStorage 恢复选中的 Hero
      if (typeof window !== "undefined") {
        const savedHeroId = window.localStorage.getItem(HERO_STORAGE_KEY);
        if (savedHeroId && heroes.some((h) => h.id === savedHeroId)) {
          set({ currentHeroId: savedHeroId });
        }
      }
    } catch (error) {
      console.error("[useHero] 加载 Heroes 失败:", error);
    }
  },
}));

/**
 * 使用 Hero 的 Hook
 */
export function useHero() {
  const heroes = useHeroStore((state) => state.heroes);
  const currentHeroId = useHeroStore((state) => state.currentHeroId);
  const loaded = useHeroStore((state) => state.loaded);
  const setCurrentHeroId = useHeroStore((state) => state.setCurrentHeroId);
  const loadHeroes = useHeroStore((state) => state.loadHeroes);

  // 自动加载 Heroes
  useEffect(() => {
    if (!loaded) {
      void loadHeroes();
    }
  }, [loaded, loadHeroes]);

  // 获取当前 Hero 对象
  const currentHero = heroes.find((h) => h.id === currentHeroId) || heroes[0];

  return {
    heroes,
    currentHero,
    currentHeroId,
    setCurrentHeroId,
    loaded,
  };
}

// ============ 兼容旧接口 ============

/** @deprecated 使用 useHeroStore */
export const useAgentStore = useHeroStore;

/** @deprecated 使用 useHero */
export function useAgent() {
  const { heroes, currentHero, currentHeroId, setCurrentHeroId, loaded } = useHero();
  return {
    agents: heroes,
    currentAgent: currentHero,
    currentAgentId: currentHeroId,
    setCurrentAgentId: setCurrentHeroId,
    loaded,
  };
}
