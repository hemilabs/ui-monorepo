'use client'

import { lazy, Suspense } from 'react'

const LocalePageRedirect = lazy(() =>
  import('components/localePageRedirect').then(mod => ({
    default: mod.LocalePageRedirect,
  })),
)

const Page = () => (
  <Suspense>
    <LocalePageRedirect redirectPage="/demos" />
  </Suspense>
)

export default Page
