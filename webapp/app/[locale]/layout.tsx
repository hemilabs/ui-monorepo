import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { locales, type Locale } from 'app/i18n'
import { networks } from 'app/networks'
import { Header } from 'components/header'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { WalletContext } from 'ui-common/components/walletContext'

import { bricolageGrotesque, inter } from '../fonts'

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
      <body
        className={`flex h-dvh flex-col bg-neutral-100 ${bricolageGrotesque.variable} ${inter.className}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WalletContext locale={locale} networks={networks}>
            <Header />
            {children}
          </WalletContext>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
