'use client'

import { useRouter } from 'i18n/navigation'
import { useEffect } from 'react'

// Applying client side redirect because it breaks on static export otherwise
export default function RootPage() {
  const router = useRouter()

  useEffect(
    function () {
      router.replace(`/ecosystem`)
    },
    [router],
  )

  return null
}
