import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { useNetworkType } from 'hooks/useNetworkType'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

import { HemiStakeHero } from './_components/hemiStakeHero'
import StakingDashboardLayoutClient from './_components/stakingDashboardLayoutClient'
import { isStakingDashboardEnabledOnTestnet } from './_utils/isStakingDashboardEnabledOnTestnet'

export const HemiStakeLayout = function () {
  const t = useTranslations('hemi-stake')
  const [networkType] = useNetworkType()

  useDocumentTitle('Hemi Stake | Hemi Portal')

  const isEnabled = isStakingDashboardEnabledOnTestnet(networkType)

  return (
    <StakingDashboardLayoutClient>
      <PageLayout variant="superWide">
        <div className="flex flex-col">
          <HemiStakeHero />
          {isEnabled ? (
            <Outlet />
          ) : (
            <TestnetDisabled subtitle={t('switch-to-start-staking')} />
          )}
        </div>
      </PageLayout>
    </StakingDashboardLayoutClient>
  )
}
