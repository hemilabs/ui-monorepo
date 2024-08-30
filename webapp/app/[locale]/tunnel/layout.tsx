'use client'

import dynamic from 'next/dynamic'
import { useSelectedLayoutSegment } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, Tab } from 'ui-common/components/tabs'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const TunnelHistorySyncStatus = dynamic(
  () =>
    import('./transaction-history/_components/tunnelHistorySyncStatus').then(
      mod => mod.TunnelHistorySyncStatus,
    ),
  { loading: () => <div />, ssr: false },
)

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const segment = useSelectedLayoutSegment()
  const t = useTranslations('tunnel-page')

  const isInTransactionHistory = segment === 'transaction-history'

  return (
    <>
      <div className="mb-3 grid grid-cols-1 justify-items-center gap-y-4 lg:grid-cols-[1fr_400px_1fr] xl:gap-x-4">
        {isInTransactionHistory ? <TunnelHistorySyncStatus /> : <div />}
        <Tabs>
          <Tab href="/tunnel" selected={segment === null}>
            <span className="flex h-full min-h-7 items-center">
              {t('title')}
            </span>
          </Tab>
          <Tab
            href="/tunnel/transaction-history"
            selected={isInTransactionHistory}
          >
            <div className="flex min-h-7 items-center justify-between gap-x-2">
              <span>{t('transaction-history.title')}</span>
              <ActionableOperations />
            </div>
          </Tab>
        </Tabs>
      </div>
      {children}
    </>
  )
}
