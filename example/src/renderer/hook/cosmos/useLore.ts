/**
 * Lore - 设定管理
 * 包含 Slice + 业务逻辑
 */

import { Lore, LoreInsert } from "@common/schema";
import { gen } from "@common/lib/generator";

// ==================== 类型定义 ====================

export interface LoreSlice {
  lores: Record<string, Lore>;
  setLores: (lores: Record<string, Lore>) => void;
  insertLore: (lore: LoreInsert) => void;
  updateLore: (id: string, updates: LoreInsert) => void;
  removeLore: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createLoreSlice = (set: any, _: any): LoreSlice => ({
  lores: {},

  setLores: (lores) =>
    set(() => ({
      lores,
    })),

  insertLore: async (lore) => {
    const newLore = await window.api.cosmos.lore.create(lore);
    set((state: LoreSlice) => ({
      lores: {
        ...state.lores,
        [newLore.id]: newLore,
      },
    }));
  },

  updateLore: async (id, updates) => {
    const updatedLore = await window.api.cosmos.lore.update({
      id,
      ...updates,
    });
    set((state: LoreSlice) => ({
      lores: {
        ...state.lores,
        [id]: updatedLore,
      },
    }));
  },

  removeLore: async (id) => {
    const deletedLore = await window.api.cosmos.lore.delete(id);
    if (deletedLore.success) {
      set((state: LoreSlice) => {
        const newLores = { ...state.lores };
        delete newLores[id];
        return { lores: newLores };
      });
    }
  },
});

// ==================== 业务逻辑函数 ====================

/** 创建新的设定实例 */
export function createLoreInstance(props?: Partial<Lore>): Lore {
  const defaultLore: Lore = {
    id: gen.id(),
    parent_id: "",
    type_id: "default",
    name: "",
    description: "",
    created_at: Date.now(),
    updated_at: Date.now(),
    multiple: true,
  };

  return { ...defaultLore, ...props };
}
