'use client'

import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'

const StakeTabsImpl = function () {
  const locale = useLocale()
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('stake-page')

  if (
    !pathname.startsWith(`/${locale}/stake/`) ||
    !isStakeEnabledOnTestnet(networkType)
  ) {
    return null
  }

  const isInDashboard = pathname === `/${locale}/stake/dashboard/`
  const isInStake = pathname === `/${locale}/stake/`

  return (
    <div className="relative z-20 flex items-center justify-center gap-x-4 sm:flex-col sm:gap-y-4">
      <Tabs>
        <Tab href="/stake/dashboard" selected={isInDashboard}>
          <span className="flex justify-center">{t('dashboard.title')}</span>
        </Tab>
        <Tab href="/stake" selected={isInStake}>
          <span className="flex justify-center">{t('stake.title')}</span>
        </Tab>
      </Tabs>
    </div>
  )
}

export const StakeTabs = () => (
  <Suspense>
    <StakeTabsImpl />
  </Suspense>
)
