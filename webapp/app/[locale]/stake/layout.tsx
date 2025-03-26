'use client'

import { StakeTabs } from 'components/stakeTabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { StakeDisabledTestnet } from './_components/stakeDisabledTestnet'
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

  if (!isStakeEnabledOnTestnet(networkType)) {
    return <StakeDisabledTestnet />
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
