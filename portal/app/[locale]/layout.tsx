import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { ErrorBoundary } from 'components/errorBoundary'
import { ConnectWalletDrawerProvider } from 'context/connectWalletDrawerContext'
import { TunnelHistoryProvider } from 'context/tunnelHistoryContext'
import { WalletsContext } from 'context/walletsContext'
import { interDisplay, interVariable } from 'fonts/index'
import { type Locale, routing } from 'i18n/routing'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { PropsWithChildren, Suspense } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import { Analytics } from './_components/analytics'
import { AppLayout } from './_components/appLayout'
import { AppOverlays } from './_components/appOverlays'
import { Navbar } from './_components/navbar'
import { Workers } from './_components/workers'

type PageProps = {
  params: { locale: Locale }
}

async function getMessages(locale: Locale) {
  if (!hasLocale(routing.locales, locale)) {
    notFound()
    return undefined
  }
  // See https://github.com/amannn/next-intl/issues/663
  // and https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#add-setrequestlocale-to-all-relevant-layouts-and-pages
  setRequestLocale(locale)

  try {
    return (await import(`../../messages/${locale}.json`)).default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    notFound()
  }
  return undefined
}

export async function generateMetadata({
  params: { locale },
}: PageProps): Promise<Metadata> {
  const { metadata } = await getMessages(locale)

  return {
    title: metadata.title,
  }
}

export const generateStaticParams = async () =>
  routing.locales.map(locale => ({ locale }))

export default async function RootLayout({
  children,
  params: { locale },
}: PropsWithChildren<PageProps>) {
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body
        className={`${interVariable.variable} ${interDisplay.variable} w-svw overflow-y-hidden`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkeletonTheme baseColor="#E5E5E5" highlightColor="#FAFAFA">
            {/* This suspense wrapper is needed because, from this point downwards, rendering depends on 
          getting mainnet|testnet from query string, and using useSearchParams (through nuqs) requires so to compile.
          However, there's no change at all in the UI, so no fallback seems to be needed, as it isn't an async request
          or something that requires showing something. */}
            <WalletsContext locale={locale}>
              <ConnectWalletDrawerProvider>
                <Suspense>
                  <TunnelHistoryProvider>
                    <Analytics>
                      <div className="flex h-dvh flex-nowrap justify-stretch bg-white">
                        <div className="hidden w-1/4 max-w-64 md:block">
                          <Navbar />
                        </div>
                        <AppLayout>
                          <ErrorBoundary>{children}</ErrorBoundary>
                          <AppOverlays />
                          <Workers />
                        </AppLayout>
                      </div>
                    </Analytics>
                  </TunnelHistoryProvider>
                </Suspense>
              </ConnectWalletDrawerProvider>
            </WalletsContext>
          </SkeletonTheme>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
