import { defineRouting } from 'next-intl/routing'

const defaultLocale = 'en' as const
const locales = [defaultLocale, 'es'] as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  defaultLocale,
  localeDetection: false,
  locales,
})
