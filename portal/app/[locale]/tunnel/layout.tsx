import { TunnelTabs } from 'components/tunnelTabs'
import { TransactionsInProgressProvider } from 'context/transactionsInProgressContext'
import { type Locale } from 'i18n/routing'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ViewOperation } from './_components/viewOperation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: `${t('tunnel-page.document-title')} | ${t('metadata.title')}`,
  }
}

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <TransactionsInProgressProvider>
      <div className="mb-4 mt-5 md:hidden">
        <TunnelTabs />
      </div>
      {children}
      <ViewOperation />
    </TransactionsInProgressProvider>
  )
}
