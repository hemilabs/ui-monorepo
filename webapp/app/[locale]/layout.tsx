import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { ConnectWalletDrawerProvider } from 'app/context/connectWalletDrawerContext'
import { TunnelHistoryProvider } from 'app/context/tunnelHistoryContext'
import { locales, type Locale } from 'app/i18n'
import { ErrorBoundary } from 'components/errorBoundary'
import { WalletsContext } from 'context/walletsContext'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { Suspense } from 'react'

import { inter } from '../fonts'

import { AppLayout } from './_components/appLayout'
import { Navbar } from './_components/navbar'

async function getMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }
  return undefined
}

export const generateStaticParams = async () =>
  locales.map(locale => ({ locale }))

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body className={`${inter.className} w-svw overflow-y-hidden`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* This suspense wrapper is needed because, from this point downwards, rendering depends on 
          getting mainnet|testnet from query string, and using useSearchParams (through nuqs) requires so to compile.
          However, there's no change at all in the UI, so no fallback seems to be needed, as it isn't an async request
          or something that requires showing something. */}
          <Suspense>
            <WalletsContext locale={locale}>
              <TunnelHistoryProvider>
                <ConnectWalletDrawerProvider>
                  <div className="flex h-dvh flex-nowrap justify-stretch bg-white">
                    <div className="hidden w-1/4 max-w-64 md:block">
                      <Navbar />
                    </div>
                    <AppLayout>
                      <ErrorBoundary>{children}</ErrorBoundary>
                    </AppLayout>
                  </div>
                </ConnectWalletDrawerProvider>
              </TunnelHistoryProvider>
            </WalletsContext>
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
