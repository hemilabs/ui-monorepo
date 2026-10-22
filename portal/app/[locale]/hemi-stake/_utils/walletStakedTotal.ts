import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { isAddressEqual, type Address } from 'viem'

export const isActiveStake = (
  { owner, status }: StakingPosition,
  wallet: Address,
) => status === StakingPositionStatus.ACTIVE && isAddressEqual(owner, wallet)

export const sumActiveStake = (
  positions: StakingPosition[],
  wallet: Address | undefined,
) =>
  wallet === undefined
    ? BigInt(0)
    : positions
        .filter(position => isActiveStake(position, wallet))
        .reduce((total, { amount }) => total + amount, BigInt(0))
