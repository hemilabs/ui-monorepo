import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { ConnectWalletDrawerProvider } from 'context/connectWalletDrawerContext'
import { TunnelHistoryProvider } from 'context/tunnelHistoryContext'
import { WalletsContext } from 'context/walletsContext'
import { interDisplay, interVariable } from 'fonts/index'
import { type Locale, routing } from 'i18n/routing'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { PropsWithChildren, Suspense } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import { Analytics } from './_components/analytics'
import { AppLayout } from './_components/appLayout'
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
          <NuqsAdapter>
            <SkeletonTheme baseColor="#E5E5E5" highlightColor="#FAFAFA">
              <WalletsContext locale={locale}>
                <ConnectWalletDrawerProvider>
                  <Analytics>
                    <TunnelHistoryProvider>
                      <div className="flex h-dvh flex-nowrap justify-stretch bg-white">
                        <div className="hidden w-1/4 max-w-60 lg:block">
                          <Navbar />
                        </div>
                        <AppLayout>
                          {/* Last resort Suspense wrapper usage.
                        Ideally, Suspense wrappers should be added where needed in each page */}
                          <Suspense>{children}</Suspense>
                          <Workers />
                        </AppLayout>
                      </div>
                    </TunnelHistoryProvider>
                  </Analytics>
                </ConnectWalletDrawerProvider>
              </WalletsContext>
            </SkeletonTheme>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
