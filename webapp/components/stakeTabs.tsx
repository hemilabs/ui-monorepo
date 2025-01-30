'use client'

import { featureFlags } from 'app/featureFlags'
import { Tab, Tabs } from 'components/tabs'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Suspense } from 'react'

const StakeTabsImpl = function () {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('stake-page')

  if (
    !pathname.startsWith(`/${locale}/stake/`) ||
    !featureFlags.stakeCampaignEnabled
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
