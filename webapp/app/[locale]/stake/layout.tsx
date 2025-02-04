'use client'

import { featureFlags } from 'app/featureFlags'
import { StakeTabs } from 'components/stakeTabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { useDrawerStakeQueryString } from './_hooks/useDrawerStakeQueryString'

const ManageStake = dynamic(
  () => import('./_components/manageStake').then(mod => mod.ManageStake),
  {
    ssr: false,
  },
)

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString, tokenAddress } =
    useDrawerStakeQueryString()
  const stakeTokens = useStakeTokens()

  if (!tokenAddress || !drawerMode) {
    return null
  }

  const token = stakeTokens.find(t => t.address === tokenAddress)

  if (!token) {
    return null
  }

  return (
    <ManageStake
      closeDrawer={() => setDrawerQueryString(null, null)}
      initialOperation={drawerMode === 'manage' ? 'unstake' : 'stake'}
      mode={drawerMode}
      token={token}
    />
  )
}

type Props = {
  children: React.ReactNode
}

const Layout = function ({ children }: Props) {
  const [networkType] = useNetworkType()

  if (!featureFlags.stakeCampaignEnabled) {
    // TODO redirect to 404 page, which should be implemented - See https://github.com/hemilabs/ui-monorepo/issues/620
    return null
  }

  if (!isStakeEnabledOnTestnet(networkType)) {
    // TODO Add custom staking page - See https://github.com/hemilabs/ui-monorepo/issues/806
    return null
  }

  return (
    <>
      <div className="mb-4 mt-5 md:hidden">
        <StakeTabs />
      </div>
      {children}
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}

export default Layout
