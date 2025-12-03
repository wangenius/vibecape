export const i18n = {
  defaultLocale: 'en',
  locales: ['zh-CN', 'en'] as string[],
}

export type Locale = (typeof i18n)['locales'][number] | string

export function isLocale(value: string): value is Locale {
  return i18n.locales.includes(value as Locale)
}
