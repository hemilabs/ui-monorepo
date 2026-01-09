'use client'

import { Drawer } from 'components/drawer'

import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'

import { ReviewIncreaseAmount } from './increaseAmount'
import { ReviewIncreaseUnlockTime } from './increaseUnlockTime'
import { ReviewCollectRewards } from './reviewCollectRewards'
import { ReviewStake } from './reviewStake'
import { ReviewUnlock } from './reviewUnlock'

type Props = {
  closeDrawer: VoidFunction
}

const reviewComponents = {
  claimingRewards: ReviewCollectRewards,
  increasingAmount: ReviewIncreaseAmount,
  increasingUnlockTime: ReviewIncreaseUnlockTime,
  staking: ReviewStake,
  unlocking: ReviewUnlock,
} as const

export const StakeReview = function ({ closeDrawer }: Props) {
  const { drawerMode } = useDrawerStakingQueryString()

  const ReviewComponent = drawerMode ? reviewComponents[drawerMode] : null

  if (!ReviewComponent) {
    return null
  }

  return (
    <Drawer onClose={closeDrawer}>
      <div className="drawer-content h-[80dvh] md:h-full">
        <ReviewComponent onClose={closeDrawer} />
      </div>
    </Drawer>
  )
}
