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

/** 使用历史记录 store（支持 selector） */
export function usePromptHistory<T = HistoryStore>(
  selector?: (state: HistoryStore) => T
): T {
  return useHistoryStore(selector ?? ((state) => state as T));
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

