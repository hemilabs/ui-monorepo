import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'i18n/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'use-intl'

import { isStakingDashboardEnabledOnTestnet } from '../_utils/isStakingDashboardEnabledOnTestnet'

const tabs = [
  { href: '/hemi-stake', label: 'stake' },
  { href: '/hemi-stake/analytics', label: 'analytics' },
  { href: '/hemi-stake/estimator', label: 'estimator' },
] as const

const HemiStakeTabsImpl = function () {
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('hemi-stake.tabs')

  const current = tabs.find(tab => tab.href === pathname)

  if (!current || !isStakingDashboardEnabledOnTestnet(networkType)) {
    return null
  }

  return (
    <div className="flex md:w-fit">
      <Tabs>
        {tabs.map(tab => (
          <Tab href={tab.href} key={tab.href} selected={tab === current}>
            <span className="flex justify-center">{t(tab.label)}</span>
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export const HemiStakeTabs = () => (
  <Suspense>
    <HemiStakeTabsImpl />
  </Suspense>
)
