/**
 * 润色状态管理 Store
 * 用于管理编辑器润色请求和结果
 */

import { create } from "zustand";

export interface PolishRequest {
  id: string;
  originalText: string;
  requirement: string;
  position: { top: number; left: number };
  selectionRange: { from: number; to: number };
}

export interface PolishResult extends PolishRequest {
  polishedText: string;
  status: "loading" | "success" | "error";
  error?: string;
}

type StartPolishFn = (request: PolishRequest) => Promise<void>;

interface PolishState {
  activePolish: PolishResult | null;
  /** 注册的 startPolish 函数（由 PolishManager 组件注册） */
  _startPolishFn: StartPolishFn | null;
  setActivePolish: (polish: PolishResult | null) => void;
  updatePolish: (updater: (prev: PolishResult | null) => PolishResult | null) => void;
  /** 注册 startPolish 函数 */
  registerStartPolish: (fn: StartPolishFn | null) => void;
  /** 启动润色请求（外部调用入口） */
  startPolish: (request: PolishRequest) => Promise<void>;
}

export const usePolishStore = create<PolishState>((set, get) => ({
  activePolish: null,
  _startPolishFn: null,
  
  setActivePolish: (polish) => set({ activePolish: polish }),
  
  updatePolish: (updater) => set((state) => ({ 
    activePolish: updater(state.activePolish) 
  })),
  
  registerStartPolish: (fn) => set({ _startPolishFn: fn }),
  
  startPolish: async (request) => {
    const fn = get()._startPolishFn;
    if (fn) {
      await fn(request);
    } else {
      console.warn("[PolishStore] startPolish called but no handler registered");
    }
  },
}));
