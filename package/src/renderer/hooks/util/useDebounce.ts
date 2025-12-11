import { useCallback, useEffect, useRef, useState } from 'react';

type AnyFunction = (...args: any[]) => any;

export function useDebounce<T>(value: T, delay: number): T {
  const isFunction = typeof value === 'function';
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value);
  const timerRef = useRef<NodeJS.Timeout>();
  const valueRef = useRef(value);
  valueRef.current = value;

  // 函数防抖
  const debouncedFn = useCallback(
    (...args: any[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => (valueRef.current as AnyFunction)(...args), delay);
    },
    [delay]
  );

  // 值防抖
  useEffect(() => {
    if (isFunction) return;
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, isFunction]);

  return (isFunction ? debouncedFn : debouncedValue) as T;
}

