'use client'

import { FormoAnalyticsProvider } from '@formo/analytics'
import { useQueryClient } from '@tanstack/react-query'
import { UmamiAnalyticsProvider } from 'components/umamiAnalyticsProvider'
import { allEvmNetworksWalletConfig } from 'context/evmWalletContext'
import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { ComponentProps, Suspense } from 'react'

const GlobalTracking = dynamic(
  () => import('./globalTracking').then(mod => mod.GlobalTracking),
  { ssr: false },
)

const FormoTracking = dynamic(
  () => import('./formoTracking').then(mod => mod.FormoTracking),
  { ssr: false },
)

export const Analytics = function ({
  children,
}: Pick<ComponentProps<typeof UmamiAnalyticsProvider>, 'children'>) {
  const locale = useLocale()
  const queryClient = useQueryClient()

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
        {process.env.NEXT_PUBLIC_ANALYTICS_FORMO_WRITE_KEY ? (
          <FormoAnalyticsProvider
            options={{
              wagmi: {
                config: allEvmNetworksWalletConfig,
                queryClient,
              },
            }}
            writeKey={process.env.NEXT_PUBLIC_ANALYTICS_FORMO_WRITE_KEY}
          >
            <Suspense>
              <FormoTracking />
            </Suspense>
            {children}
          </FormoAnalyticsProvider>
        ) : (
          children
        )}
      </UmamiAnalyticsProvider>
    </>
  )
}
