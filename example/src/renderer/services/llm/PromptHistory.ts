import { gen } from '@common/lib/generator';
import { create } from 'zustand';

export interface HistoryState {
  story: Record<string, string>;
  actant: Record<string, string>;
  chapterize: Record<string, string>;
  boom: Record<string, string>;
  continue: Record<string, string>;
  optimise: Record<string, string>;
}

interface HistoryStore extends HistoryState {
  add: (kind: keyof HistoryState, story: string) => void;
  remove: (kind: keyof HistoryState, id: string) => void;
  setState: (state: Partial<HistoryState>) => void;
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  story: {},
  actant: {},
  chapterize: {},
  boom: {},
  continue: {},
  optimise: {},
  add: (kind, story) => {
    const id = gen.id();
    set((state) => ({
      ...state,
      [kind]: {
        ...state[kind],
        [id]: story,
      },
    }));
  },
  remove: (kind, id) => {
    set((state) => {
      const { [id]: _, ...rest } = state[kind];
      return { ...state, [kind]: rest };
    });
  },
  setState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// ==================== Hooks ====================

/** 使用历史记录 store */
export function usePromptHistory() {
  return useHistoryStore();
}

/** 获取指定类型的历史记录 */
export function usePromptHistoryByType(kind: keyof HistoryState) {
  return useHistoryStore(state => state[kind]);
}

// ==================== 操作函数 ====================

/** 添加历史记录 */
export function addPromptHistory(kind: keyof HistoryState, story: string) {
  useHistoryStore.getState().add(kind, story);
}

/** 删除历史记录 */
export function removePromptHistory(kind: keyof HistoryState, id: string) {
  useHistoryStore.getState().remove(kind, id);
}

/** 设置历史记录状态 */
export function setPromptHistoryState(state: Partial<HistoryState>) {
  useHistoryStore.getState().setState(state);
}

// ==================== 向后兼容的类包装器 ====================
// 仅用于兼容，建议直接使用函数和 hooks

export class ExtraHistory {
  static use = useHistoryStore;

  static add = (kind: keyof HistoryState, story: string) => {
    addPromptHistory(kind, story);
  };

  static remove = (kind: keyof HistoryState, id: string) => {
    removePromptHistory(kind, id);
  };
}
