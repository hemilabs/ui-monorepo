'use client'

import { defaultLocale, locales } from 'app/i18n'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Applying client side redirect because it breaks on static export otherwise
export default function RootPage() {
  const router = useRouter()

  useEffect(
    function () {
      const [language] = navigator.language.split('-')
      // @ts-expect-error navigator.language is a valid string
      const enabledLanguage = locales.includes(language)
      router.replace(`/${enabledLanguage ? language : defaultLocale}/bridge`)
    },
    [router],
  )

  return null
}
