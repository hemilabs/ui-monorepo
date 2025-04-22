'use client'

import { type AnalyticsEventsWithChain } from 'app/analyticsEvents'
import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const TunnelTabsImpl = function () {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()
  const t = useTranslations('tunnel-page')
  const { track } = useUmami()

  const tunnelHref = useTunnelOperationByConnectedWallet()

  if (!pathname.startsWith(`/tunnel/`)) {
    return null
  }

  const isInTransactionHistory = pathname === `/tunnel/transaction-history/`

  const addTracking = (eventName: AnalyticsEventsWithChain) =>
    track ? () => track(eventName, { chain: networkType }) : undefined

  return (
    <div className="flex items-center justify-center gap-x-4">
      <Tabs>
        <Tab
          href={tunnelHref}
          onClick={addTracking('header - tunnel')}
          selected={pathname === '/tunnel/'}
        >
          <span className="flex h-full min-h-7 items-center justify-center">
            {t('title')}
          </span>
        </Tab>
        <Tab
          href="/tunnel/transaction-history"
          onClick={addTracking('header - txn history')}
          selected={isInTransactionHistory}
        >
          <div className="flex items-center justify-center gap-x-2">
            <span>{t('transaction-history.title')}</span>
            <ActionableOperations />
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}

export const TunnelTabs = () => (
  <Suspense>
    <TunnelTabsImpl />
  </Suspense>
)
