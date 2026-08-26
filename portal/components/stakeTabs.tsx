'use client'

import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'
import { isSamePathOrUnder } from 'utils/url'

const StakeTabsImpl = function () {
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('stake-page')

  if (
    !isSamePathOrUnder(pathname, '/stake') ||
    !isStakeEnabledOnTestnet(networkType)
  ) {
    return null
  }

  const isInDashboard = pathname === '/stake/dashboard'
  const isInStake = pathname === '/stake'

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
