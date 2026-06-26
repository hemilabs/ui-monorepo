'use client'

import { UmamiAnalyticsProvider } from 'components/umamiAnalyticsProvider'
import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { ComponentProps, Suspense } from 'react'

const GlobalTracking = dynamic(
  () => import('./globalTracking').then(mod => mod.GlobalTracking),
  { ssr: false },
)

export const Analytics = function ({
  children,
}: Pick<ComponentProps<typeof UmamiAnalyticsProvider>, 'children'>) {
  const locale = useLocale()

  const removeLocaleAndTrailingSlash = (url: string) =>
    (url.endsWith('/') ? url.slice(0, -1) : url).replace(`/${locale}`, '')

  return (
    <>
      <UmamiAnalyticsProvider
        autoTrack={false}
        processUrl={removeLocaleAndTrailingSlash}
        {...(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && {
          src: process.env.NEXT_PUBLIC_ANALYTICS_URL,
          websiteId: process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID,
        })}
      >
        <Suspense>
          <GlobalTracking />
        </Suspense>
        {children}
      </UmamiAnalyticsProvider>
    </>
  )
}
