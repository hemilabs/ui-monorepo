'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { useHemiToken } from 'hooks/useHemiToken'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'

import {
  StakingDashboardProvider,
  useStakingDashboard,
} from '../_context/stakingDashboardContext'
import { useDrawerStakingQueryString } from '../_hooks/useDrawerStakingQueryString'

import { Stake } from './stake'

const StakeReview = dynamic(
  () => import('./stakeReview').then(mod => mod.StakeReview),
  {
    loading: () => <DrawerLoader className="h-[95dvh] md:h-full" />,
    ssr: false,
  },
)

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerStakingQueryString()
  const { stakingDashboardOperation } = useStakingDashboard()

  if (!drawerMode || !stakingDashboardOperation) {
    return null
  }

  return <StakeReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const StakeForm = function () {
  const hemiToken = useHemiToken()

  if (!hemiToken) {
    return (
      <Skeleton
        className="min-h-128 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  return (
    <StakingDashboardProvider>
      <Stake />
      <Suspense>
        <SideDrawer />
      </Suspense>
    </StakingDashboardProvider>
  )
}
