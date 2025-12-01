/**
 * ActantType - 角色类型管理
 * 包含 Slice + 业务逻辑
 */

import { ActantType, ActantTypeInsert } from "@common/schema";
import { gen } from "@common/lib/generator";

// ==================== 类型定义 ====================

export interface ActantTypeSlice {
  actant_types: Record<string, ActantType>;
  setActantTypes: (types: Record<string, ActantType>) => void;
  insertActantType: (actantType: ActantTypeInsert) => void;
  updateActantType: (id: string, updates: ActantTypeInsert) => void;
  removeActantType: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createActantTypeSlice = (set: any, _: any): ActantTypeSlice => ({
  actant_types: {},

  setActantTypes: (actant_types) =>
    set(() => ({
      actant_types,
    })),

  insertActantType: async (actantType) => {
    const newActantType = await window.api.cosmos.actantType.create(actantType);
    set((state: ActantTypeSlice) => ({
      actant_types: {
        ...state.actant_types,
        [newActantType.id]: newActantType,
      },
    }));
  },

  updateActantType: async (id, updates) => {
    const updatedActantType = await window.api.cosmos.actantType.update({
      id,
      ...updates,
    });
    set((state: ActantTypeSlice) => ({
      actant_types: {
        ...state.actant_types,
        [id]: updatedActantType,
      },
    }));
  },

  removeActantType: async (id) => {
    const deletedActantType = await window.api.cosmos.actantType.delete(id);
    if (deletedActantType.success) {
      set((state: ActantTypeSlice) => {
        const newActantTypes = { ...state.actant_types };
        delete newActantTypes[id];
        return { actant_types: newActantTypes };
      });
    }
  },
});

// ==================== 业务逻辑函数 ====================

/** 创建新的角色类型实例 */
export function createActantTypeInstance(
  props?: Partial<ActantType>
): ActantType {
  const defaultActantType: ActantType = {
    id: gen.id(),
    name: "",
  };

  return { ...defaultActantType, ...props };
}
