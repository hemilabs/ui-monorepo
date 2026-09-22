import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'

export const sumActiveStake = (positions: StakingPosition[]) =>
  positions
    .filter(({ status }) => status === StakingPositionStatus.ACTIVE)
    .reduce((total, { amount }) => total + amount, BigInt(0))
