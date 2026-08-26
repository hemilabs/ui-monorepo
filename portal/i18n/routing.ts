import { hasLocale } from 'next-intl'
import { defineRouting } from 'next-intl/routing'

const defaultLocale = 'en' as const
export const locales = [defaultLocale, 'es', 'pt'] as const

export type Locale = (typeof locales)[number]

export function getLocalizedLocaleName(locale: Locale) {
  const displayNames = new Intl.DisplayNames([locale], { type: 'language' })
  const localeName = displayNames.of(locale)
  if (!localeName) {
    throw new Error(`Language name not found for locale: ${locale}`)
  }
  return localeName
}

export const routing = defineRouting({
  defaultLocale,
  localeDetection: false,
  locales,
})

export const resolveLocale = function (language: string) {
  const [candidate] = language.toLowerCase().split('-')
  return hasLocale(locales, candidate) ? candidate : defaultLocale
}

export const preferredLocale = () => resolveLocale(navigator.language)
