'use client'

import { ToastLoader } from 'components/toast/toastLoader'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { lazy, Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'
import {
  CollectAllRewardsDashboardStatus,
  StakingDashboardStatus,
  UnlockingDashboardStatus,
} from 'types/stakingDashboard'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { useDrawerStakingQueryString } from '../_hooks/useDrawerStakingQueryString'

import { Stake } from './stake'
import { StakeReview } from './stakeReview'

const StakeToast = lazy(() =>
  import('./stakeToast').then(mod => ({ default: mod.StakeToast })),
)

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerStakingQueryString()
  const {
    collectRewardsDashboardOperation,
    stakingDashboardOperation,
    unlockingDashboardOperation,
  } = useStakingDashboard()

  if (
    !drawerMode ||
    (!collectRewardsDashboardOperation &&
      !stakingDashboardOperation &&
      !unlockingDashboardOperation)
  ) {
    return null
  }

  return <StakeReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const StakeForm = function () {
  const {
    collectRewardsDashboardOperation,
    stakingDashboardOperation,
    unlockingDashboardOperation,
  } = useStakingDashboard()
  const hemiToken = useHemiToken()
  const t = useTranslations()

  if (!hemiToken) {
    return (
      <Skeleton
        className="min-h-136 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  const showStakeToast =
    stakingDashboardOperation?.status ===
      StakingDashboardStatus.STAKE_TX_CONFIRMED &&
    stakingDashboardOperation.transactionHash

  const showUnlockToast =
    unlockingDashboardOperation?.status ===
      UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED &&
    unlockingDashboardOperation.transactionHash

  const showCollectRewardsToast =
    collectRewardsDashboardOperation?.status ===
      CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED &&
    collectRewardsDashboardOperation.transactionHash

  return (
    <>
      {showStakeToast && (
        <Suspense fallback={<ToastLoader />}>
          <StakeToast
            title={t('staking-dashboard.stake-successful')}
            transactionHash={stakingDashboardOperation.transactionHash!}
          />
        </Suspense>
      )}
      {showUnlockToast && (
        <Suspense fallback={<ToastLoader />}>
          <StakeToast
            title={t('staking-dashboard.unlock-successful')}
            transactionHash={unlockingDashboardOperation.transactionHash!}
          />
        </Suspense>
      )}
      {showCollectRewardsToast && (
        <Suspense fallback={<ToastLoader />}>
          <StakeToast
            title={t('staking-dashboard.claim-rewards-successful')}
            transactionHash={collectRewardsDashboardOperation.transactionHash!}
          />
        </Suspense>
      )}
      <Stake />
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}
