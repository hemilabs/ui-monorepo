import { defineRouting } from 'next-intl/routing'

const defaultLocale = 'en' as const
export const locales = [defaultLocale, 'es', 'pt'] as const

export type Locale = (typeof locales)[number]

export function getLocalizedLocaleName(locale: Locale) {
  const displayNames = new Intl.DisplayNames([locale], { type: 'language' })
  return displayNames.of(locale)
}

export const routing = defineRouting({
  defaultLocale,
  localeDetection: false,
  locales,
})
