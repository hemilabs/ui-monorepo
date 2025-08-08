'use client'

import Skeleton from 'react-loading-skeleton'

import {
  StakingDashboardStake,
  TypedStakingDashboardState,
  useStakingDashboardState,
} from '../_hooks/useStakingDashboardState'

import { Stake } from './stake'

export const StakeForm = function ({
  state,
}: {
  state: ReturnType<typeof useStakingDashboardState>
}) {
  const { hydrated } = state

  if (!hydrated) {
    return (
      <Skeleton
        className="h-[510px] max-w-[536px] rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  // Typescript can't infer it, but we can cast these safely
  return (
    <Stake state={state as TypedStakingDashboardState<StakingDashboardStake>} />
  )
}
