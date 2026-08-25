import { ErrorBoundary } from 'components/errorBoundary'
import { ConnectWalletDrawerProvider } from 'context/connectWalletDrawerContext'
import { TunnelHistoryProvider } from 'context/tunnelHistoryContext'
import { WalletsContext } from 'context/walletsContext'
import { DocumentTitleProvider } from 'hooks/useDocumentTitle'
import { getMessages } from 'i18n/messages'
import { type Locale, resolveLocale, routing } from 'i18n/routing'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { Suspense, use, useEffect } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'
import { Navigate, Outlet, useLocation, useParams } from 'react-router'

import { Analytics } from './_components/analytics'
import { AppLayout } from './_components/appLayout'
import { AppOverlays } from './_components/appOverlays'
import { NavbarDesktop } from './_components/navbar/navbarDesktop'
import { RouteError } from './_components/routeError'
import { Workers } from './_components/workers'

const Shell = function ({ locale }: { locale: Locale }) {
  const messages = use(getMessages(locale))

  useEffect(
    function syncDocumentLanguage() {
      document.documentElement.lang = locale
    },
    [locale],
  )

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DocumentTitleProvider defaultTitle={messages.metadata.title}>
        <SkeletonTheme baseColor="#E5E5E5" highlightColor="#FAFAFA">
          <WalletsContext locale={locale}>
            <ConnectWalletDrawerProvider>
              <Analytics>
                <TunnelHistoryProvider>
                  <div className="flex h-dvh flex-nowrap justify-stretch bg-white">
                    <div className="max-xl:hidden">
                      <NavbarDesktop />
                    </div>
                    <AppLayout>
                      <ErrorBoundary
                        fallback={({ reset }) => <RouteError reset={reset} />}
                      >
                        {/* Last resort Suspense wrapper usage.
                      Ideally, Suspense wrappers should be added where needed in each page */}
                        <Suspense>
                          <Outlet />
                        </Suspense>
                      </ErrorBoundary>
                      <AppOverlays />
                      <Workers />
                    </AppLayout>
                  </div>
                </TunnelHistoryProvider>
              </Analytics>
            </ConnectWalletDrawerProvider>
          </WalletsContext>
        </SkeletonTheme>
      </DocumentTitleProvider>
    </NextIntlClientProvider>
  )
}

export const LocaleLayout = function () {
  const { locale } = useParams()
  const { pathname, search } = useLocation()

  if (!hasLocale(routing.locales, locale)) {
    // Keep everything after the unknown locale, so a link shared with a locale
    // we do not support still lands on the page it pointed at.
    const rest = pathname.replace(/^\/[^/]*/, '')
    return (
      <Navigate
        replace
        to={{
          pathname: `/${resolveLocale(navigator.language)}${rest}`,
          search,
        }}
      />
    )
  }

  return (
    <Suspense>
      <Shell locale={locale} />
    </Suspense>
  )
}
