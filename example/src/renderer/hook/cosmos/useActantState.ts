/**
 * ActantState - 角色状态管理
 * 包含 Slice + 业务逻辑
 */

import { ActantState, ActantStateInsert } from "@common/schema";

// ==================== 类型定义 ====================

export interface ActantStateSlice {
  actant_states: Record<string, ActantState>;
  setActantStates: (states: Record<string, ActantState>) => void;
  insertActantState: (state: ActantStateInsert) => Promise<void>;
  updateActantState: (id: string, updates: ActantStateInsert) => void;
  removeActantState: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createActantStateSlice = (set: any, _: any): ActantStateSlice => ({
  actant_states: {},

  setActantStates: (actantStates) =>
    set(() => ({
      actant_states: actantStates,
    })),

  insertActantState: async (actantState: ActantStateInsert) => {
    const newActantState =
      await window.api.cosmos.actantState.create(actantState);
    set((state: ActantStateSlice) => ({
      actant_states: {
        ...state.actant_states,
        [newActantState.id]: newActantState,
      },
    }));
  },

  updateActantState: async (id, updates) => {
    const updatedActantState = await window.api.cosmos.actantState.update({
      id,
      ...updates,
    });
    set((state: ActantStateSlice) => ({
      actant_states: {
        ...state.actant_states,
        [id]: updatedActantState,
      },
    }));
  },

  removeActantState: async (id) => {
    const deletedActantState = await window.api.cosmos.actantState.delete(id);
    if (deletedActantState.success) {
      set((state: ActantStateSlice) => {
        const newStates = { ...state.actant_states };
        delete newStates[id];
        return { actant_states: newStates };
      });
    }
  },
});
