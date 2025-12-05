/**
 * 头像缓存 Hook
 * 将远程头像缓存到 localStorage，避免重复请求
 */

import { useState, useEffect } from "react";

const CACHE_PREFIX = "avatar_cache_";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 天过期

interface CacheEntry {
  dataUrl: string;
  timestamp: number;
}

/**
 * 从缓存获取头像
 */
function getFromCache(url: string): string | null {
  try {
    const key = CACHE_PREFIX + btoa(url);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.dataUrl;
  } catch {
    return null;
  }
}

/**
 * 保存头像到缓存
 */
function saveToCache(url: string, dataUrl: string): void {
  try {
    const key = CACHE_PREFIX + btoa(url);
    const entry: CacheEntry = {
      dataUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // 存储满了，清理旧缓存
    clearOldCache();
  }
}

/**
 * 清理过期缓存
 */
function clearOldCache(): void {
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_PREFIX)
  );
  for (const key of keys) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

/**
 * 将图片 URL 转换为 base64 DataURL
 */
async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 使用缓存的头像 Hook
 */
export function useCachedAvatar(url: string): string {
  const [src, setSrc] = useState<string>(() => {
    // 优先从缓存读取
    return getFromCache(url) || url;
  });

  useEffect(() => {
    // 如果已经是 data URL，不需要处理
    if (url.startsWith("data:")) {
      setSrc(url);
      return;
    }

    // 检查缓存
    const cached = getFromCache(url);
    if (cached) {
      setSrc(cached);
      return;
    }

    // 从远程获取并缓存
    let cancelled = false;
    fetchAsDataUrl(url)
      .then((dataUrl) => {
        if (!cancelled) {
          saveToCache(url, dataUrl);
          setSrc(dataUrl);
        }
      })
      .catch(() => {
        // 失败时使用原始 URL
        if (!cancelled) {
          setSrc(url);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return src;
}

/**
 * 缓存头像组件的 Props
 */
export interface CachedAvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * 带缓存的头像组件
 */
export function CachedAvatar({ src, ...props }: CachedAvatarProps) {
  const cachedSrc = useCachedAvatar(src);
  return <img src={cachedSrc} {...props} />;
}
