'use client';

import { useCallback, useEffect } from 'react';
import type { Locale } from './config';
import { getDictionaryForNamespaces } from './get-dictionary-v2';

/**
 * 预加载命名空间的 Hook
 * 用于在组件中提前加载可能需要的翻译
 */
export function usePreloadNamespaces(
  locale: Locale,
  namespaces: string[]
): void {
  // 使用 useCallback 确保函数引用稳定
  const preload = useCallback(async () => {
    try {
      await getDictionaryForNamespaces(locale, namespaces);
    } catch (error) {
      console.warn('Failed to preload namespaces:', namespaces, error);
    }
  }, [locale, namespaces]);
  
  // 在组件挂载时预加载
  useEffect(() => {
    if (typeof window !== 'undefined') {
      preload();
    }
  }, [preload]);
}

/**
 * 获取翻译加载统计信息（开发环境）
 */
export function useTranslationStats() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // 简化版本：返回基本统计信息
  return {
    cached: 0,
    loading: 0,
  };
}

