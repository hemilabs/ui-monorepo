import { type StakingPosition } from 'types/stakingDashboard'

export const sortPositionsByUnlock = (positions: StakingPosition[]) =>
  [...positions].sort((left, right) =>
    Number(left.effectiveLockEnd - right.effectiveLockEnd),
  )
