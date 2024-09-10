'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { Tabs, Tab } from 'ui-common/components/tabs'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const TunnelTabsImpl = function () {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('tunnel-page')

  if (!pathname.startsWith(`/${locale}/tunnel/`)) {
    return null
  }

  const isInTransactionHistory =
    pathname === `/${locale}/tunnel/transaction-history/`

  return (
    <div className="flex items-center justify-center gap-x-4">
      <Tabs>
        <Tab href="/tunnel" selected={pathname === `/${locale}/tunnel/`}>
          <span className="flex h-full min-h-7 items-center">{t('title')}</span>
        </Tab>
        <Tab
          href="/tunnel/transaction-history"
          selected={isInTransactionHistory}
        >
          <div className="flex items-center justify-between gap-x-2">
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
