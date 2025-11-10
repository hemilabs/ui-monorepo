'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { LinesBackground } from 'components/linesBackground'
import { StakeTabs } from 'components/stakeTabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { useStakeTokens } from 'hooks/useStakeTokens'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { useDrawerStakeQueryString } from '../_hooks/useDrawerStakeQueryString'

import { StakeDisabledTestnet } from './stakeDisabledTestnet'

const ManageStake = dynamic(
  () => import('./manageStake').then(mod => mod.ManageStake),
  {
    loading: () => <DrawerLoader className="h-[95dvh] md:h-full" />,
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
      <div className="hidden md:block">
        <LinesBackground />
      </div>
    </>
  )
}

export default StakeLayoutClient
