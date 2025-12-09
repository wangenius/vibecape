import { useCallback, useRef } from "react";

// 简单防抖 hook
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  const timerRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

// 更新 llm.txt
export const updateLlmTxt = async (content: string) => {
  await window.api.vibecape.setLlmTxt(content);
};
