'use client'

import dynamic from 'next/dynamic'

const LocalePageRedirect = dynamic(
  () =>
    import('components/localePageRedirect').then(mod => mod.LocalePageRedirect),
  { ssr: false },
)

const Page = () => <LocalePageRedirect redirectPage="/btc-yield" />

export default Page
