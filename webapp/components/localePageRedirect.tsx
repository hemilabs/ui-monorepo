'use client'

import { defaultLocale, locales } from 'app/i18n'
import { useRedirectToDefaultLocale } from 'hooks/useRedirectToDefaultLocale'

type Props = {
  redirectPage: `/${string}`
}

// Applying client side redirect because it breaks on static export otherwise
export const LocalePageRedirect = function ({ redirectPage }: Props) {
  useRedirectToDefaultLocale({
    defaultLocale,
    locales,
    redirectPage,
  })

  return null
}
