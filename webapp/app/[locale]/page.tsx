'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

// Applying client side redirect because it breaks on static export otherwise
export default function RootPage() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(
    function () {
      router.replace(`/${locale}/tunnel`)
    },
    [locale, router],
  )

  return null
}
