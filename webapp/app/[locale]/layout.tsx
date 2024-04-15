import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { locales, type Locale } from 'app/i18n'
import { networks } from 'app/networks'
import { AppScreen } from 'components/appScreen'
import { RecaptchaContext } from 'components/recaptcha'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { WalletContext } from 'ui-common/components/walletContext'

import { inter } from '../fonts'

import Navbar from './navbar'

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
      <body className={`flex h-dvh flex-col bg-white ${inter.className}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RecaptchaContext>
            <WalletContext locale={locale} networks={networks}>
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="hidden md:block">
                    <Navbar />
                  </div>
                  <AppScreen>{children}</AppScreen>
                </div>
              </div>
            </WalletContext>
          </RecaptchaContext>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
