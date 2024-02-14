import 'styles/globals.css'

import { locales, type Locale } from 'app/i18n'
import { bricolageGrotesque, inter } from 'fonts'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'

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
        className={`font-inter flex w-full flex-col py-7 ${bricolageGrotesque.variable} ${inter.className} bg-zinc-100 px-4`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <div className="mt-6 sm:mx-auto sm:w-4/5 lg:w-3/4 xl:w-5/6 2xl:max-w-[1500px]">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
