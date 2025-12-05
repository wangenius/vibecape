import { create } from "zustand";

// ============================================================================
// UI Store - UI 状态管理
// ============================================================================

type UIState = {
  loading: boolean;
  listLoading: boolean;
  initProgress: string | null;
  error?: string;
};

type UIActions = {
  setLoading: (loading: boolean) => void;
  setListLoading: (loading: boolean) => void;
  setInitProgress: (progress: string | null) => void;
  setError: (error: string) => void;
  clearError: () => void;
};

export const useUIStore = create<UIState & UIActions>()((set) => ({
  loading: false,
  listLoading: false,
  initProgress: null,
  error: undefined,

  setLoading: (loading) => set({ loading }),
  setListLoading: (listLoading) => set({ listLoading }),
  setInitProgress: (initProgress) => set({ initProgress }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: undefined }),
}));
