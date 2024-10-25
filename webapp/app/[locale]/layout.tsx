import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { ConnectWalletDrawerProvider } from 'app/context/connectWalletDrawerContext'
import { TunnelHistoryProvider } from 'app/context/tunnelHistoryContext'
import { locales, type Locale } from 'app/i18n'
import { ErrorBoundary } from 'components/errorBoundary'
import { WalletsContext } from 'context/walletsContext'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { PropsWithChildren, Suspense } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import { inter } from '../fonts'

import { Analytics } from './_components/analytics'
import { AppLayout } from './_components/appLayout'
import { Navbar } from './_components/navbar'

type PageProps = {
  params: { locale: Locale }
}

async function getMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default
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
  locales.map(locale => ({ locale }))

export default async function RootLayout({
  children,
  params: { locale },
}: PropsWithChildren<PageProps>) {
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body className={`${inter.className} w-svw overflow-y-hidden`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkeletonTheme baseColor="#E5E5E5" highlightColor="#FAFAFA">
            {/* This suspense wrapper is needed because, from this point downwards, rendering depends on 
          getting mainnet|testnet from query string, and using useSearchParams (through nuqs) requires so to compile.
          However, there's no change at all in the UI, so no fallback seems to be needed, as it isn't an async request
          or something that requires showing something. */}
            <Suspense>
              <WalletsContext locale={locale}>
                <TunnelHistoryProvider>
                  <ConnectWalletDrawerProvider>
                    <Analytics>
                      <div className="flex h-dvh flex-nowrap justify-stretch bg-white">
                        <div className="hidden w-1/4 max-w-64 md:block">
                          <Navbar />
                        </div>
                        <AppLayout>
                          <ErrorBoundary>{children}</ErrorBoundary>
                        </AppLayout>
                      </div>
                    </Analytics>
                  </ConnectWalletDrawerProvider>
                </TunnelHistoryProvider>
              </WalletsContext>
            </Suspense>
          </SkeletonTheme>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
