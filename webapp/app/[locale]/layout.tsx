import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { EvmWalletContext } from 'app/context/evmWalletContext'
import { TunnelHistoryProvider } from 'app/context/tunnelHistoryContext'
import { locales, type Locale } from 'app/i18n'
import { AppScreen } from 'components/appScreen'
import { ErrorBoundary } from 'components/errorBoundary'
import { RecaptchaContext } from 'components/recaptcha'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'

import { inter } from '../fonts'

import { Navbar } from './navbar'

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
          <RecaptchaContext>
            <EvmWalletContext locale={locale}>
              <TunnelHistoryProvider>
                <div className="flex h-dvh flex-nowrap justify-stretch">
                  <div className="hidden w-1/4 max-w-56 md:block">
                    <Navbar />
                  </div>
                  <AppScreen>
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </AppScreen>
                </div>
              </TunnelHistoryProvider>
            </EvmWalletContext>
          </RecaptchaContext>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
