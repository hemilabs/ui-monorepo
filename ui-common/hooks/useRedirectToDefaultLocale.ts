'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useRedirectToDefaultLocale = function ({
  defaultLocale,
  locales,
  redirectPage,
}: {
  defaultLocale: string
  locales: readonly string[]
  redirectPage?: string
}) {
  const router = useRouter()

  useEffect(
    function () {
      const [language] = navigator.language.split('-')
      const enabledLanguage = locales.includes(language)
      router.replace(
        `/${enabledLanguage ? language : defaultLocale}${
          redirectPage
            ? redirectPage.startsWith('/')
              ? redirectPage
              : `$/${redirectPage}`
            : ''
        }`,
      )
    },
    [defaultLocale, locales, router, redirectPage],
  )
}
