import { lazyWithFallback } from 'components/lazyWithFallback'
import { ToastLoader } from 'components/toast/toastLoader'
import { useHemiToken } from 'hooks/useHemiToken'
import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import {
  CollectAllRewardsDashboardStatus,
  StakingDashboardStatus,
  UnlockingDashboardStatus,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { useDrawerStakingQueryString } from '../_hooks/useDrawerStakingQueryString'

import { Stake } from './stake'
import { StakeReview } from './stakeReview'

const StakeToast = lazyWithFallback(
  () => import('./stakeToast').then(mod => ({ default: mod.StakeToast })),
  <ToastLoader />,
)

const ClaimRewardsFailedToast = lazyWithFallback(
  () =>
    import('./claimRewardsFailedToast').then(mod => ({
      default: mod.ClaimRewardsFailedToast,
    })),
  <ToastLoader />,
)

const ClaimRewardsFailedNotice = function () {
  const { drawerMode } = useDrawerStakingQueryString()
  const { collectRewardsDashboardOperation } = useStakingDashboard()

  const isDrawerOpen = drawerMode === 'claimingRewards'
  const hasFailed =
    collectRewardsDashboardOperation?.status ===
    CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED

  const [prevHasFailed, setPrevHasFailed] = useState(hasFailed)
  const [showToast, setShowToast] = useState(false)

  if (hasFailed !== prevHasFailed) {
    setPrevHasFailed(hasFailed)
    setShowToast(hasFailed && !isDrawerOpen)
  }
  if (showToast && isDrawerOpen) {
    setShowToast(false)
  }

  return showToast ? <ClaimRewardsFailedToast /> : null
}

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerStakingQueryString()
  const {
    collectRewardsDashboardOperation,
    stakingDashboardOperation,
    unlockingDashboardOperation,
  } = useStakingDashboard()

  const hasRequiredOperation: Record<
    NonNullable<typeof drawerMode>,
    boolean
  > = {
    claimingRewards: !!collectRewardsDashboardOperation,
    increasingAmount: !!stakingDashboardOperation,
    increasingUnlockTime: !!stakingDashboardOperation,
    staking: true,
    unlocking: !!unlockingDashboardOperation,
  }

  if (!drawerMode || !hasRequiredOperation[drawerMode]) {
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
        <StakeToast
          title={t('hemi-stake.stake-successful')}
          transactionHash={stakingDashboardOperation.transactionHash!}
        />
      )}
      {showUnlockToast && (
        <StakeToast
          title={t('hemi-stake.unlock-successful')}
          transactionHash={unlockingDashboardOperation.transactionHash!}
        />
      )}
      {showCollectRewardsToast && (
        <StakeToast
          title={t('hemi-stake.claim-rewards-successful')}
          transactionHash={collectRewardsDashboardOperation.transactionHash!}
        />
      )}
      <Stake />
      <Suspense>
        <ClaimRewardsFailedNotice />
        <SideDrawer />
      </Suspense>
    </>
  )
}
