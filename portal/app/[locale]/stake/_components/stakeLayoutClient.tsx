'use client'

import { StakeTabs } from 'components/stakeTabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { useDrawerStakeQueryString } from '../_hooks/useDrawerStakeQueryString'

import { ManageStake } from './manageStake'
import { StakeDisabledTestnet } from './stakeDisabledTestnet'

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

const StakeLayoutClient = function ({ children }: Props) {
  const [networkType] = useNetworkType()

  if (!isStakeEnabledOnTestnet(networkType)) {
    return <StakeDisabledTestnet />
  }

  return (
    <>
      <div className="mb-4 mt-5 px-4 md:hidden">
        <StakeTabs />
      </div>
      {children}
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}

export default StakeLayoutClient
