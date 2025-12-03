import type { Locale } from "./config";
import type { NestedDictionary } from "./types";

/**
 * 简化的字典加载器
 * 直接按照 src/lib/i18n/locales 的结构加载翻译文件
 */

// 缓存已加载的字典
const dictionaryCache = new Map<string, NestedDictionary>();

/**
 * 深度合并对象
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        result[key] || {},
        source[key]
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * 加载指定语言的完整字典
 */
export async function loadDictionary(
  locale: Locale
): Promise<NestedDictionary> {
  const cacheKey = locale;

  // 检查缓存
  if (dictionaryCache.has(cacheKey)) {
    return dictionaryCache.get(cacheKey)!;
  }

  try {
    const dictionary: NestedDictionary = {};

    // 加载所有翻译文件
    const files = [
      "common",
      "home",
      "auth",
      "dashboard",
      "client/dashboard",
      "client/campaigns",
      "client/drafts",
      "client/quickmatch",
      "client/subscription",
      "client/account",
      "vendor/dashboard",
      "vendor/assignments",
      "vendor/profile",
      "vendor/cases",
      "vendor/application",
      "vendor/requirements",
    ];

    // 并行加载所有文件
    const loadPromises = files.map(async (file) => {
      try {
        let data: any = {};

        // 优先使用动态导入（在 Next.js 中，客户端和服务端都可以使用）
        try {
          const imported = await import(`@/lib/i18n/locales/${locale}/${file}.json`);
          // 如果是 ES 模块，取 default 属性
          data = imported.default || imported;
        } catch (importError) {
          // 动态导入失败，尝试其他方法
          if (typeof window !== "undefined") {
            // 客户端：尝试 fetch
            try {
              const response = await fetch(`/api/i18n/${locale}/${file}`);
              if (response.ok) {
                data = await response.json();
              }
            } catch (fetchError) {
              // fetch 也失败，data 保持为空对象
            }
          } else {
            // 服务端：尝试文件系统（仅在开发环境或动态导入失败时）
            try {
              const fs = await import("fs");
              const path = await import("path");

              // 尝试多个可能的路径
              const possiblePaths = [
                path.join(process.cwd(), "src", "lib", "i18n", "locales", locale, `${file}.json`),
                path.join(process.cwd(), "lib", "i18n", "locales", locale, `${file}.json`),
              ];

              for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                  try {
                    const content = fs.readFileSync(filePath, "utf8");
                    data = JSON.parse(content);
                    break; // 找到文件后退出循环
                  } catch (parseError) {
                    console.warn(`Failed to parse translation file: ${filePath}`, parseError);
                  }
                }
              }
            } catch (fsError) {
              // 文件系统访问失败，data 保持为空对象
            }
          }
        }

        return { file, data };
      } catch (error) {
        console.warn(
          `Failed to load translation file: ${locale}/${file}.json`,
          error
        );
        return { file, data: {} };
      }
    });

    const results = await Promise.all(loadPromises);

    // 合并所有翻译数据
    let hasValidData = false;
    for (const { file, data } of results) {
      // 检查是否有有效数据
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        hasValidData = true;
      }
      
      if (file.includes("/")) {
        // 处理嵌套路径，如 client/client -> dictionary.client.client
        const [namespace, subkey] = file.split("/");
        if (!dictionary[namespace]) {
          dictionary[namespace] = {};
        }
        (dictionary[namespace] as NestedDictionary)[subkey] = data;
      } else {
        // 对于根级别文件，将内容放在对应的命名空间下
        // 例如 home.json -> dictionary.home = data
        // 特殊处理：如果 dashboard.json 中有 client 键，将其合并到 dictionary.client
        if (file === "dashboard" && data.client && typeof data.client === "object" && !Array.isArray(data.client)) {
          if (!dictionary.client) {
            dictionary.client = {};
          }
          // 深度合并 client 对象
          dictionary.client = deepMerge(dictionary.client, data.client as NestedDictionary);
          // 同时保留 dashboard 命名空间的内容（如果没有 client 键）
          const { client, ...rest } = data;
          if (Object.keys(rest).length > 0) {
            dictionary[file] = rest;
          }
        } else {
          dictionary[file] = data;
        }
      }
    }

    // 确保至少有一些有效数据（允许部分文件缺失，只要核心文件加载成功即可）
    if (!hasValidData) {
      console.error(`No valid translation data loaded for locale "${locale}". Dictionary keys:`, Object.keys(dictionary));
      throw new Error(`No valid translation data loaded for locale "${locale}"`);
    }
    
    // 如果字典为空对象，也抛出错误
    if (Object.keys(dictionary).length === 0) {
      throw new Error(`Dictionary is empty for locale "${locale}"`);
    }

    // 缓存结果
    dictionaryCache.set(cacheKey, dictionary);
    return dictionary;
  } catch (error) {
    console.error(`Failed to load dictionary for locale "${locale}":`, error);
    throw new Error(`Unsupported locale: ${locale}`);
  }
}

/**
 * 清除缓存（用于开发环境）
 */
export function clearDictionaryCache(): void {
  dictionaryCache.clear();
}

/**
 * 预加载字典
 */
export function preloadDictionary(locale: Locale): void {
  loadDictionary(locale).catch((error) => {
    console.warn(`Failed to preload dictionary for locale "${locale}":`, error);
  });
}
