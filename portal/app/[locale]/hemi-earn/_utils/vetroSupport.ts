import { type Locale } from 'i18n/routing'

const vetroLocales: Locale[] = ['en', 'es']
const vetroFallbackLocale = 'en'

export const getVetroSupportUrl = (locale: Locale) =>
  `https://app.vetro.org/${
    vetroLocales.includes(locale) ? locale : vetroFallbackLocale
  }/contact`
