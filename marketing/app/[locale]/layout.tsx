import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

import { locales, type Locale } from 'app/i18n'
import { networks } from 'app/networks'
import { bricolageGrotesque, inter } from 'fonts'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { WalletContext } from 'ui-common/components/walletContext'

import { Header } from './header'

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
        className={`font-inter flex flex-col py-7 ${bricolageGrotesque.variable} ${inter.className} bg-zinc-100`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WalletContext networks={networks} locale={locale}>
            {/* These styles can't be on body because they break with RainbowKit https://github.com/rainbow-me/rainbowkit/issues/609 */}
            <div className="w-full px-4 sm:mx-auto sm:w-4/5 lg:w-3/4 xl:w-5/6 2xl:max-w-[1500px]">
              <Header />
              <div className="mt-6">{children}</div>
            </div>
          </WalletContext>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
