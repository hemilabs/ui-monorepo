import { lazyWithFallback } from 'components/lazyWithFallback'
import { UmamiAnalyticsProvider } from 'components/umamiAnalyticsProvider'
import { ComponentProps, useCallback } from 'react'
import { parsePath } from 'react-router'
import { useLocale } from 'use-intl'
import { unlocalizedPathname } from 'utils/url'

const GlobalTracking = lazyWithFallback(() =>
  import('./globalTracking').then(mod => ({ default: mod.GlobalTracking })),
)

export const Analytics = function ({
  children,
}: Pick<ComponentProps<typeof UmamiAnalyticsProvider>, 'children'>) {
  const locale = useLocale()

  const processUrl = useCallback(
    function stripLocale(url: string) {
      const { pathname = '', search = '' } = parsePath(url)
      return `${unlocalizedPathname(pathname, locale)}${search}`
    },
    [locale],
  )

  return (
    <>
      <UmamiAnalyticsProvider
        autoTrack={false}
        processUrl={processUrl}
        {...(import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && {
          src: import.meta.env.VITE_ANALYTICS_URL,
          websiteId: import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
        })}
      >
        <GlobalTracking />
        {children}
      </UmamiAnalyticsProvider>
    </>
  )
}
