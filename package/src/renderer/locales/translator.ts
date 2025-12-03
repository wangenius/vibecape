import type { NestedDictionary, TranslationValue } from './types'

export type TranslateOptions = {
  fallback?: string
  values?: Record<string, string | number>
}

export function resolveTranslationValue(dictionary: NestedDictionary, key: string): TranslationValue | undefined {
  return key.split('.').reduce<TranslationValue | undefined>((acc, segment) => {
    if (acc == null) return undefined
    if (Array.isArray(acc)) {
      const index = Number(segment)
      if (Number.isNaN(index)) return undefined
      return acc[index]
    }
    if (typeof acc !== 'object') {
      return undefined
    }
    return acc[segment]
  }, dictionary)
}

export function formatTemplate(template: string, values?: Record<string, string | number>) {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, token) => {
    const replacement = values[token]
    return replacement == null ? match : String(replacement)
  })
}

export function translate(dictionary: NestedDictionary, key: string, options?: TranslateOptions) {
  const fallback = options?.fallback ?? key
  const resolved = resolveTranslationValue(dictionary, key)

  if (typeof resolved === 'string') {
    return formatTemplate(resolved, options?.values)
  }

  return fallback
}


function deepMerge(target: any, source: any): any {
  // If either is not an object (or is null), source takes precedence if defined, otherwise target
  if (
    typeof target !== "object" ||
    target === null ||
    typeof source !== "object" ||
    source === null
  ) {
    return source ?? target;
  }

  // If arrays, merge by index
  if (Array.isArray(target) && Array.isArray(source)) {
    const length = Math.max(target.length, source.length);
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = deepMerge(target[i], source[i]);
    }
    return result;
  }

  // If type mismatch between array and object, source wins
  if (Array.isArray(target) !== Array.isArray(source)) {
    return source;
  }

  // Merge objects
  const result = { ...target };
  for (const key of Object.keys(source)) {
    // Recursively merge keys present in source
    result[key] = deepMerge(target[key], source[key]);
  }
  return result;
}

export function resolveResource<T extends TranslationValue>(
  dictionary: NestedDictionary,
  key: string,
  fallback: T
) {
  const resolved = resolveTranslationValue(dictionary, key);
  
  if (resolved === undefined) {
    return fallback;
  }

  return deepMerge(fallback, resolved) as T;
}

export function createTranslator(dictionary: NestedDictionary) {
  return {
    t: (key: string, options?: TranslateOptions) => translate(dictionary, key, options),
    get: <T extends TranslationValue>(key: string, fallback: T) => resolveResource<T>(dictionary, key, fallback),
  }
}
