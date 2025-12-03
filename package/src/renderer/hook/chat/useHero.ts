import { useEffect } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { HeroInfo } from "@common/api/chat";

const HERO_STORAGE_KEY = "jezzlab.ai.hero";

interface HeroState {
  // 所有可用的 Heroes
  heroes: HeroInfo[];
  // 当前选中的 Hero ID
  currentHeroId: string;
  // 是否已加载
  loaded: boolean;
  // 是否正在加载
  loading: boolean;
}

interface HeroActions {
  setCurrentHeroId: (id: string) => void;
  loadHeroes: () => Promise<void>;
  // 获取当前 Hero（computed getter）
  getCurrentHero: () => HeroInfo | undefined;
}

type HeroStore = HeroState & HeroActions;

/**
 * Hero Store - 使用 subscribeWithSelector 支持精确订阅
 */
export const useHeroStore = create<HeroStore>()(
  subscribeWithSelector((set, get) => ({
    heroes: [],
    currentHeroId: (() => {
      // 初始化时从 localStorage 读取
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(HERO_STORAGE_KEY) || "nova";
      }
      return "nova";
    })(),
    loaded: false,
    loading: false,

    setCurrentHeroId: (id: string) => {
      const { heroes, currentHeroId } = get();
      
      // 避免无意义的更新
      if (id === currentHeroId) {
        console.log("[useHeroStore] setCurrentHeroId: same id, skipping", id);
        return;
      }

      // 验证 id 是否有效（如果 heroes 已加载）
      if (heroes.length > 0 && !heroes.some((h) => h.id === id)) {
        console.warn("[useHeroStore] setCurrentHeroId: invalid id", id);
        return;
      }

      console.log("[useHeroStore] setCurrentHeroId:", id);
      set({ currentHeroId: id });

      // 持久化到 localStorage
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(HERO_STORAGE_KEY, id);
        } catch (e) {
          console.warn("[useHeroStore] Failed to save to localStorage:", e);
        }
      }
    },

    loadHeroes: async () => {
      const { loaded, loading } = get();
      
      // 防止重复加载
      if (loaded || loading) return;

      set({ loading: true });

      try {
        const heroes = await window.api.chat.heroes();
        const { currentHeroId } = get();

        // 验证当前选中的 heroId 是否有效，如果无效则重置为第一个
        const isValidHeroId = heroes.some((h) => h.id === currentHeroId);
        const finalHeroId = isValidHeroId ? currentHeroId : heroes[0]?.id || "nova";

        set({
          heroes,
          currentHeroId: finalHeroId,
          loaded: true,
          loading: false,
        });

        // 如果 heroId 被重置，更新 localStorage
        if (!isValidHeroId && finalHeroId !== currentHeroId) {
          window.localStorage.setItem(HERO_STORAGE_KEY, finalHeroId);
        }

        console.log("[useHeroStore] Heroes loaded:", heroes.length, "current:", finalHeroId);
      } catch (error) {
        console.error("[useHeroStore] 加载 Heroes 失败:", error);
        set({ loading: false });
      }
    },

    getCurrentHero: () => {
      const { heroes, currentHeroId } = get();
      return heroes.find((h) => h.id === currentHeroId) || heroes[0];
    },
  }))
);

/**
 * 使用 Hero 的 Hook - 返回稳定的引用
 */
export function useHero() {
  // 使用 useShallow 进行浅比较，避免不必要的重渲染
  const { heroes, currentHeroId, loaded, loading } = useHeroStore(
    useShallow((state) => ({
      heroes: state.heroes,
      currentHeroId: state.currentHeroId,
      loaded: state.loaded,
      loading: state.loading,
    }))
  );

  // 直接从 store 获取稳定的 action 引用（不会变化）
  const setCurrentHeroId = useHeroStore((state) => state.setCurrentHeroId);
  const loadHeroes = useHeroStore((state) => state.loadHeroes);

  // 自动加载 Heroes
  useEffect(() => {
    void loadHeroes();
  }, [loadHeroes]);

  // 计算当前 Hero - 使用 store 的 getter 确保一致性
  const currentHero = useHeroStore((state) => state.getCurrentHero());

  return {
    heroes,
    currentHero,
    currentHeroId,
    setCurrentHeroId,
    loaded,
    loading,
  };
}

/**
 * 仅获取当前 Hero ID（用于不需要完整 hero 数据的场景）
 */
export function useCurrentHeroId() {
  return useHeroStore((state) => state.currentHeroId);
}

/**
 * 仅获取 setCurrentHeroId action（用于只需要切换功能的场景）
 */
export function useSetCurrentHeroId() {
  return useHeroStore((state) => state.setCurrentHeroId);
}

