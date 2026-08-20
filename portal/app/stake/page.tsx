'use client'

import { lazy, Suspense } from 'react'

const LocalePageRedirect = lazy(() =>
  import('components/localePageRedirect').then(mod => ({
    default: mod.LocalePageRedirect,
  })),
)

const Page = () => (
  <Suspense>
    <LocalePageRedirect redirectPage="/stake/dashboard" />
  </Suspense>
)

export default Page
