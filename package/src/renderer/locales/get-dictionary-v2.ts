import type { Locale } from './config';
import type { NestedDictionary } from './types';
import { loadDictionary } from './dictionary-loader';

/**
 * 路由到命名空间的映射
 * 根据路由自动确定需要加载的命名空间
 */
const routeToNamespaces: Record<string, string[]> = {
  '/': ['common', 'home'],
  '/client': ['common', 'dashboard', 'client'],
  '/vendor': ['common', 'dashboard', 'vendor'],
  '/auth': ['common', 'auth'],
  '/coins': ['common', 'dashboard', 'coins'],
};

/**
 * 命名空间到文件路径的映射
 */
const namespaceToFiles: Record<string, string[]> = {
  common: ['common'],
  home: ['home'],
  auth: ['auth'],
  dashboard: ['dashboard'],
  'dashboard-common': ['dashboard'],
  'dashboard-client': ['dashboard', 'client/dashboard'],
  'dashboard-vendor': ['dashboard', 'vendor/dashboard'],
  client: ['client/dashboard', 'client/campaigns', 'client/drafts', 'client/quickmatch', 'client/subscription', 'client/account'],
  vendor: ['vendor/dashboard', 'vendor/assignments', 'vendor/profile', 'vendor/cases', 'vendor/application'],
  coins: ['dashboard'], // coins 相关翻译可能在 dashboard 中
};

/**
 * 根据路由获取需要加载的命名空间
 */
function getNamespacesForRoute(route: string): string[] {
  // 精确匹配
  if (routeToNamespaces[route]) {
    return routeToNamespaces[route];
  }
  
  // 前缀匹配
  for (const [pattern, namespaces] of Object.entries(routeToNamespaces)) {
    if (route.startsWith(pattern)) {
      return namespaces;
    }
  }
  
  // 默认返回 common
  return ['common'];
}

/**
 * 根据命名空间获取需要加载的文件路径
 */
function getFilesForNamespaces(namespaces: string[]): string[] {
  const files = new Set<string>();
  
  // common 总是需要
  files.add('common');
  
  for (const namespace of namespaces) {
    const namespaceFiles = namespaceToFiles[namespace] || [];
    namespaceFiles.forEach(file => files.add(file));
  }
  
  return Array.from(files);
}

/**
 * 加载指定文件的翻译数据
 */
async function loadTranslationFile(locale: Locale, file: string): Promise<any> {
  try {
    const imported = await import(`@/lib/i18n/locales/${locale}/${file}.json`);
    return imported.default || imported;
  } catch (error) {
    console.warn(`Failed to load translation file: ${locale}/${file}.json`, error);
    return {};
  }
}

/**
 * 根据命名空间加载部分字典
 */
async function loadDictionaryByNamespaces(
  locale: Locale,
  namespaces: string[]
): Promise<NestedDictionary> {
  const files = getFilesForNamespaces(namespaces);
  const dictionary: NestedDictionary = {};
  
  // 并行加载所有文件
  const loadPromises = files.map(async (file) => {
    const data = await loadTranslationFile(locale, file);
    return { file, data };
  });
  
  const results = await Promise.all(loadPromises);
  
  // 合并所有翻译数据
  for (const { file, data } of results) {
    if (file.includes('/')) {
      const [namespace, subkey] = file.split('/');
      if (!dictionary[namespace]) {
        dictionary[namespace] = {};
      }
      (dictionary[namespace] as NestedDictionary)[subkey] = data;
    } else {
      dictionary[file] = data;
    }
  }
  
  return dictionary;
}

/**
 * 根据路由获取字典（v2 API）
 * 自动根据路由加载相关的命名空间
 */
export async function getDictionary(
  locale: Locale,
  route: string = '/'
): Promise<NestedDictionary> {
  const namespaces = getNamespacesForRoute(route);
  return await loadDictionaryByNamespaces(locale, namespaces);
}

/**
 * 根据指定的命名空间获取字典（v2 API）
 */
export async function getDictionaryForNamespaces(
  locale: Locale,
  namespaces: string[]
): Promise<NestedDictionary> {
  return await loadDictionaryByNamespaces(locale, namespaces);
}

