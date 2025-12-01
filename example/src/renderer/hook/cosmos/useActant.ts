/**
 * Actant - 角色管理
 * 包含 Slice + 业务逻辑
 */

import type { Actant, ActantInsert } from "@common/schema";
import { ActantStateSlice } from "./useActantState";

// ==================== 类型定义 ====================

export interface ActantSlice {
  actants: Record<string, Actant>;
  setActants: (actants: Record<string, Actant>) => void;
  insertActant: (actant: ActantInsert) => void;
  updateActant: (id: string, updates: ActantInsert) => void;
  removeActant: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createActantSlice = (set: any, _: any): ActantSlice => ({
  actants: {},

  setActants: (actants) => {
    set(() => ({
      actants,
    }));
  },

  insertActant: async (actant: ActantInsert) => {
    const { actant: newActant, state: newState } =
      await window.api.cosmos.actant.create(actant);
    set((state: ActantSlice) => ({
      actants: {
        ...state.actants,
        [newActant.id]: newActant,
      },
    }));
    set((state: ActantStateSlice) => ({
      actant_states: {
        ...state.actant_states,
        [newState.id]: newState,
      },
    }));
  },

  updateActant: async (id, updates) => {
    const updatedActant = await window.api.cosmos.actant.update({
      id,
      ...updates,
    });
    set((state: ActantSlice) => ({
      actants: {
        ...state.actants,
        [id]: updatedActant,
      },
    }));
  },

  removeActant: async (id) => {
    const deletedActant = await window.api.cosmos.actant.delete(id);
    if (deletedActant.success) {
      set((state: ActantSlice) => {
        const newActants = { ...state.actants };
        delete newActants[id];
        return { actants: newActants };
      });
    }
  },
});
