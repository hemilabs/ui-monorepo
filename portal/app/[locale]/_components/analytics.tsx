'use client'

import { UmamiAnalyticsProvider } from 'components/umamiAnalyticsProvider'
import { useLocale } from 'next-intl'
import { ComponentProps, lazy, Suspense } from 'react'

const GlobalTracking = lazy(() =>
  import('./globalTracking').then(mod => ({ default: mod.GlobalTracking })),
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
        {...(import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && {
          src: import.meta.env.VITE_ANALYTICS_URL,
          websiteId: import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
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
