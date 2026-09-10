import { featureFlags } from 'app/featureFlags'
import { PageLayout } from 'components/pageLayout'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useNetworkType } from 'hooks/useNetworkType'
import { Outlet, useMatch } from 'react-router'
import { useTranslations } from 'use-intl'
import { isAddress } from 'viem'

import { NotFound } from '../not-found'

import { EarnStatusUpdaters } from './_components/earnStatusUpdaters'
import { TopSection } from './_components/topSection'
import { LocalEarnOperationsProvider } from './_context/localEarnOperationsContext'

export const HemiEarnLayout = function () {
  const [networkType] = useNetworkType()
  const pool = useMatch('/:locale/hemi-earn/pool/:shareAddress')
  const t = useTranslations('hemi-earn')

  if (!featureFlags.enableHemiEarnPage) {
    return <NotFound />
  }

  // Checked up here rather than in the page: below this point the layout has
  // already mounted the delivery watcher, and a 404 has no business polling.
  if (pool && !isAddress(pool.params.shareAddress ?? '')) {
    return <NotFound />
  }

  if (networkType === 'testnet') {
    return (
      <PageLayout variant="wide">
        <TopSection />
        <TestnetDisabled subtitle={t('switch-to-start-earning')} />
      </PageLayout>
    )
  }

  return (
    <LocalEarnOperationsProvider>
      <EarnStatusUpdaters />
      <Outlet />
    </LocalEarnOperationsProvider>
  )
}
