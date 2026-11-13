import { createContext, useContext, type ReactNode } from 'react'

import { useStakePrefill } from '../_hooks/useStakePrefill'
import {
  useStakingDashboardState,
  type StakingDashboardStake,
  type TypedStakingDashboardState,
} from '../_hooks/useStakingDashboardState'

type StakingDashboardContextValue =
  TypedStakingDashboardState<StakingDashboardStake>

const StakingDashboardContext = createContext<
  StakingDashboardContextValue | undefined
>(undefined)

export function StakingDashboardProvider({
  children,
}: {
  children: ReactNode
}) {
  const state = useStakingDashboardState(useStakePrefill())
  const value = state as StakingDashboardContextValue

  return (
    <StakingDashboardContext.Provider value={value}>
      {children}
    </StakingDashboardContext.Provider>
  )
}

export function useStakingDashboard(): StakingDashboardContextValue {
  const ctx = useContext(StakingDashboardContext)
  if (!ctx) {
    throw new Error(
      'useStakingDashboard must be used inside <StakingDashboardProvider>',
    )
  }
  return ctx
}
