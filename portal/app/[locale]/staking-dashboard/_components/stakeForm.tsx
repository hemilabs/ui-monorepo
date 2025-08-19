'use client'

import { useHemiToken } from 'app/[locale]/genesis-drop/_hooks/useHemiToken'
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
  const hemiToken = useHemiToken()

  if (!hemiToken) {
    return (
      <Skeleton
        className="min-h-128 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  // Typescript can't infer it, but we can cast these safely
  return (
    <Stake
      state={state as TypedStakingDashboardState<StakingDashboardStake>}
      token={hemiToken}
    />
  )
}
