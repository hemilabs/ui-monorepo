'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { ToastLoader } from 'components/toast/toastLoader'
import { useHemiToken } from 'hooks/useHemiToken'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'
import {
  StakingDashboardStatus,
  UnstakingDashboardStatus,
} from 'types/stakingDashboard'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { useDrawerStakingQueryString } from '../_hooks/useDrawerStakingQueryString'

import { Stake } from './stake'

const StakeReview = dynamic(
  () => import('./stakeReview').then(mod => mod.StakeReview),
  {
    loading: () => <DrawerLoader className="h-[95dvh] md:h-full" />,
    ssr: false,
  },
)

const StakeToast = dynamic(
  () => import('./stakeToast').then(mod => mod.StakeToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerStakingQueryString()
  const { stakingDashboardOperation, unstakingDashboardOperation } =
    useStakingDashboard()

  if (
    !drawerMode ||
    (!stakingDashboardOperation && !unstakingDashboardOperation)
  ) {
    return null
  }

  return <StakeReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const StakeForm = function () {
  const { stakingDashboardOperation, unstakingDashboardOperation } =
    useStakingDashboard()
  const hemiToken = useHemiToken()
  const t = useTranslations()

  if (!hemiToken) {
    return (
      <Skeleton
        className="min-h-128 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  const showStakeToast =
    stakingDashboardOperation?.status ===
      StakingDashboardStatus.STAKE_TX_CONFIRMED &&
    stakingDashboardOperation.transactionHash

  const showUnstakeToast =
    unstakingDashboardOperation?.status ===
      UnstakingDashboardStatus.UNSTAKE_TX_CONFIRMED &&
    unstakingDashboardOperation.transactionHash

  return (
    <>
      {showStakeToast && (
        <StakeToast
          title={t('staking-dashboard.stake-successful')}
          transactionHash={stakingDashboardOperation.transactionHash!}
        />
      )}
      {showUnstakeToast && (
        <StakeToast
          title={t('staking-dashboard.unstake-successful')}
          transactionHash={unstakingDashboardOperation.transactionHash!}
        />
      )}
      <Stake />
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}
