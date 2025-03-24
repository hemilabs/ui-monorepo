'use client'

import { useRedirectToDefaultLocale } from 'hooks/useRedirectToDefaultLocale'
import { routing } from 'i18n/routing'

type Props = {
  redirectPage: `/${string}`
}

const { defaultLocale, locales } = routing

// Applying client side redirect because it breaks on static export otherwise
export const LocalePageRedirect = function ({ redirectPage }: Props) {
  useRedirectToDefaultLocale({
    defaultLocale,
    locales,
    redirectPage,
  })

  return null
}
