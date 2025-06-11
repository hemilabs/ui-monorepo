import { defineRouting } from 'next-intl/routing'

const defaultLocale = 'en' as const
export const locales = [defaultLocale, 'es', 'pt'] as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  defaultLocale,
  localeDetection: false,
  locales,
})
