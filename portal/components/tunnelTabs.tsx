import { AnalyticsEvent } from 'app/analyticsEvents'
import { lazyWithFallback } from 'components/lazyWithFallback'
import { Tab, Tabs } from 'components/tabs'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { Suspense } from 'react'
import { UrlObject } from 'url'
import { useTranslations } from 'use-intl'
import { isSamePathOrUnder } from 'utils/url'

const ActionableOperations = lazyWithFallback(() =>
  import('components/actionableOperations').then(mod => ({
    default: mod.ActionableOperations,
  })),
)

const UI = function ({
  onTabClick,
  tunnelHref,
}: {
  onTabClick?: ((eventName: AnalyticsEvent) => void) | undefined
  tunnelHref: UrlObject | string
}) {
  const pathname = usePathname()
  const t = useTranslations('tunnel-page')

  if (!isSamePathOrUnder(pathname, '/tunnel')) {
    return null
  }

  const isInTransactionHistory = pathname === '/tunnel/transaction-history'

  return (
    <div className="flex items-center justify-center gap-x-4 max-md:px-4">
      <Tabs>
        <Tab
          href={tunnelHref}
          onClick={onTabClick ? () => onTabClick('header - tunnel') : undefined}
          selected={pathname === '/tunnel'}
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

  const { enabled, track } = useUmami()

  const onTabClick = enabled
    ? (eventName: AnalyticsEvent) => track(eventName)
    : undefined

  return <UI onTabClick={onTabClick} tunnelHref={tunnelHref} />
}

export const TunnelTabs = () => (
  <Suspense fallback={<UI tunnelHref="/tunnel" />}>
    <TunnelTabsImpl />
  </Suspense>
)
