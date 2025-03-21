'use client'

import { defaultLocale, locales } from 'app/i18n'
import { useRedirectToDefaultLocale } from 'hooks/useRedirectToDefaultLocale'

// Applying client side redirect because it breaks on static export otherwise
export default function RootPage() {
  useRedirectToDefaultLocale({
    defaultLocale,
    locales,
    redirectPage: '/tunnel',
  })

  return null
}
