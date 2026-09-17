import { lazyWithFallback } from 'components/lazyWithFallback'
import { ToastLoader } from 'components/toast/toastLoader'
import { useHemiToken } from 'hooks/useHemiToken'
import { Suspense } from 'react'
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
    // A walk over several positions names no single one, so the review reads the walk
    // instead. Either is enough to render.
    claimingRewards:
      !!collectRewardsDashboardOperation?.stakingPosition ||
      !!collectRewardsDashboardOperation?.walk?.length,
    increasingAmount: !!stakingDashboardOperation,
    increasingUnlockTime: !!stakingDashboardOperation,
    staking: true,
    // The position, not just the operation: every review reads `stakingPosition`, so an
    // operation without one mounts a component that dereferences undefined.
    unlocking: !!unlockingDashboardOperation?.stakingPosition,
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
          title={t('staking-dashboard.stake-successful')}
          transactionHash={stakingDashboardOperation.transactionHash!}
        />
      )}
      {showUnlockToast && (
        <StakeToast
          title={t('staking-dashboard.unlock-successful')}
          transactionHash={unlockingDashboardOperation.transactionHash!}
        />
      )}
      {showCollectRewardsToast && (
        <StakeToast
          title={t('staking-dashboard.claim-rewards-successful')}
          transactionHash={collectRewardsDashboardOperation.transactionHash!}
        />
      )}
      <Stake />
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}
