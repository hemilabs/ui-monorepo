import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useDocumentTitle } from 'hooks/useDocumentTitle'
import { useNetworkType } from 'hooks/useNetworkType'
import { Outlet } from 'react-router'
import { useTranslations } from 'use-intl'

import { HemiStakeHero } from './_components/hemiStakeHero'
import { HemiStakeTabs } from './_components/hemiStakeTabs'
import { isStakingDashboardEnabledOnTestnet } from './_utils/isStakingDashboardEnabledOnTestnet'

export const HemiStakeLayout = function () {
  const t = useTranslations()
  const [networkType] = useNetworkType()

  useDocumentTitle(`${t('navbar.hemi-stake')} | ${t('metadata.title')}`)

  const isEnabled = isStakingDashboardEnabledOnTestnet(networkType)

  return (
    <PageLayout variant="wide">
      <div className="flex flex-col">
        <HemiStakeHero />
        {isEnabled ? (
          <>
            <div className="mt-6 md:hidden">
              <HemiStakeTabs />
            </div>
            <Outlet />
          </>
        ) : (
          <TestnetDisabled subtitle={t('hemi-stake.switch-to-start-staking')} />
        )}
      </div>
    </PageLayout>
  )
}
