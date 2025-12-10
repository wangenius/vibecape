import { useCallback, useEffect, useRef, useState } from 'react';

type AnyFunction = (...args: any[]) => any;

export function useDebounce<T>(value: T, delay: number): T {
  const isFunction = typeof value === 'function';
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout>();

  // 函数防抖
  const debouncedFn = useCallback(
    (...args: any[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => (value as AnyFunction)(...args), delay);
    },
    [value, delay]
  );

  // 值防抖
  useEffect(() => {
    if (isFunction) return;
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, isFunction]);

  return (isFunction ? debouncedFn : debouncedValue) as T;
}

