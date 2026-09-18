import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'i18n/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'use-intl'
import { isSamePathOrUnder } from 'utils/url'

import { isStakingDashboardEnabledOnTestnet } from '../_utils/isStakingDashboardEnabledOnTestnet'

const HemiStakeTabsImpl = function () {
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('hemi-stake.tabs')

  if (
    !isSamePathOrUnder(pathname, '/hemi-stake') ||
    !isStakingDashboardEnabledOnTestnet(networkType)
  ) {
    return null
  }

  return (
    <div className="flex md:w-fit">
      <Tabs>
        <Tab href="/hemi-stake" selected={pathname === '/hemi-stake'}>
          <span className="flex justify-center">{t('stake')}</span>
        </Tab>
        <Tab
          href="/hemi-stake/analytics"
          selected={pathname === '/hemi-stake/analytics'}
        >
          <span className="flex justify-center">{t('analytics')}</span>
        </Tab>
      </Tabs>
    </div>
  )
}

export const HemiStakeTabs = () => (
  <Suspense>
    <HemiStakeTabsImpl />
  </Suspense>
)
