import 'styles/globals.css'
import 'react-loading-skeleton/dist/skeleton.css'

import { locales, type Locale } from 'app/i18n'
import { Header } from 'components/header'
import { WalletContext } from 'components/wallet-integration/walletContext'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'

import { bricolageGrotesque, inter } from '../fonts'

export const metadata: Metadata = {
  title: 'BVM',
}

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
        className={`flex min-h-screen flex-col bg-neutral-100 ${bricolageGrotesque.variable} ${inter.className}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WalletContext>
            <Header />
            {children}
          </WalletContext>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
