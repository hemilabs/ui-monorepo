import { hemiEarnLinks } from '@vetro-protocol/earn/hemiEarn'
import { type Locale } from 'i18n/routing'

const vetroLocales: Locale[] = ['en', 'es']
const vetroFallbackLocale = 'en'

export const getVetroSupportUrl = function (locale: Locale) {
  const url = new URL(hemiEarnLinks.supportUrl)
  const language = vetroLocales.includes(locale) ? locale : vetroFallbackLocale
  url.pathname = `/${language}${url.pathname}`
  return url.toString()
}
