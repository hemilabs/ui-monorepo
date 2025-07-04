'use client'

import { AnalyticsEvent } from 'app/analyticsEvents'
import { Tab, Tabs } from 'components/tabs'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { UrlObject } from 'url'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const UI = function ({
  onTabClick,
  tunnelHref,
}: {
  onTabClick?: (eventName?: AnalyticsEvent) => void
  tunnelHref: UrlObject | string
}) {
  const pathname = usePathnameWithoutLocale()
  const t = useTranslations('tunnel-page')

  if (!pathname.startsWith(`/tunnel/`)) {
    return null
  }

  const isInTransactionHistory = pathname === `/tunnel/transaction-history/`

  return (
    <div className="flex items-center justify-center gap-x-4">
      <Tabs>
        <Tab
          href={tunnelHref}
          onClick={onTabClick ? () => onTabClick('header - tunnel') : undefined}
          selected={pathname === '/tunnel/'}
        >
          <span className="flex h-full min-h-7 items-center justify-center">
            {t('title')}
          </span>
        </Tab>
        <Tab
          href="/tunnel/transaction-history"
          onClick={
            onTabClick ? () => onTabClick('header - txn history') : undefined
          }
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

const TunnelTabsImpl = function () {
  const tunnelHref = useTunnelOperationByConnectedWallet()

  const { track } = useUmami()

  const onTabClick = track
    ? (eventName: AnalyticsEvent) => track(eventName)
    : undefined

  return <UI onTabClick={onTabClick} tunnelHref={tunnelHref} />
}

export const TunnelTabs = () => (
  <Suspense fallback={<UI tunnelHref="/tunnel" />}>
    <TunnelTabsImpl />
  </Suspense>
)
