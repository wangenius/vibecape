import type { Locale } from './config'
import type { NestedDictionary } from './types'
import { loadDictionary } from './dictionary-loader'

/**
 * 获取指定语言的完整字典
 * 简化版本，直接从 src/lib/i18n/locales 加载
 */
export async function getDictionary(locale: Locale): Promise<NestedDictionary> {
  return await loadDictionary(locale)
}
