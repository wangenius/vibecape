/**
 * LoreType - 设定类型管理
 * 包含 Slice + 业务逻辑
 */

import { gen } from "@common/lib/generator";
import { LoreType, LoreTypeInsert } from "@common/schema";

// ==================== 类型定义 ====================

export interface LoreTypeSlice {
  lore_types: Record<string, LoreType>;
  setLoreTypes: (types: Record<string, LoreType>) => void;
  insertLoreType: (loreType: LoreTypeInsert) => void;
  updateLoreType: (id: string, updates: LoreTypeInsert) => void;
  removeLoreType: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createLoreTypeSlice = (set: any, _: any): LoreTypeSlice => ({
  lore_types: {},

  setLoreTypes: (lore_types) =>
    set(() => ({
      lore_types,
    })),

  insertLoreType: async (loreType) => {
    const newLoreType = await window.api.cosmos.loreType.create(loreType);
    set((state: LoreTypeSlice) => ({
      lore_types: {
        ...state.lore_types,
        [newLoreType.id]: newLoreType,
      },
    }));
  },

  updateLoreType: async (id, updates) => {
    const updatedLoreType = await window.api.cosmos.loreType.update({
      id,
      ...updates,
    });
    set((state: LoreTypeSlice) => ({
      lore_types: {
        ...state.lore_types,
        [id]: updatedLoreType,
      },
    }));
  },

  removeLoreType: async (id) => {
    const deletedLoreType = await window.api.cosmos.loreType.delete(id);
    if (deletedLoreType.success) {
      set((state: LoreTypeSlice) => {
        const newLoreTypes = { ...state.lore_types };
        delete newLoreTypes[id];
        return { lore_types: newLoreTypes };
      });
    }
  },
});

// ==================== 业务逻辑函数 ====================

/** 创建新的设定类型实例 */
export function createLoreTypeInstance(props?: Partial<LoreType>): LoreType {
  const defaultLoreType: LoreType = {
    id: gen.id(),
    name: "",
  };

  return { ...defaultLoreType, ...props };
}
