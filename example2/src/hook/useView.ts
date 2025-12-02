"use client";

import { useEffect, useState } from "react";

// 自定义事件，用于跨组件通信
const BAYBAR_TOGGLE_EVENT = "baybar-toggle";

/**
 * 触发 Baybar 状态变更事件
 */
export const toggleBayBar = (open?: boolean) => {
  const currentState = localStorage.getItem("isBayBarOpen") === "true";
  const newState = open !== undefined ? open : !currentState;

  localStorage.setItem("isBayBarOpen", String(newState));
  window.dispatchEvent(new CustomEvent(BAYBAR_TOGGLE_EVENT, { detail: newState }));
};

/**
 * 获取当前 Baybar 状态
 */
export const getBayBarOpen = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isBayBarOpen") === "true";
};

/**
 * Hook: 监听和管理 Baybar 打开状态
 */
export function useView(): { isBayBarOpen: boolean };
export function useView<T>(selector: (state: { isBayBarOpen: boolean }) => T): T;
export function useView<T>(selector?: (state: { isBayBarOpen: boolean }) => T) {
  // 初始化为 false 避免 hydration 错误
  const [isBayBarOpen, setIsBayBarOpen] = useState(false);

  useEffect(() => {
    // 挂载后读取 localStorage
    setIsBayBarOpen(getBayBarOpen());

    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setIsBayBarOpen(customEvent.detail);
    };

    window.addEventListener(BAYBAR_TOGGLE_EVENT, handleToggle);

    return () => {
      window.removeEventListener(BAYBAR_TOGGLE_EVENT, handleToggle);
    };
  }, []);

  const state = { isBayBarOpen };

  // 兼容 zustand 风格的 selector 用法
  if (selector) {
    return selector(state);
  }

  return state;
}

