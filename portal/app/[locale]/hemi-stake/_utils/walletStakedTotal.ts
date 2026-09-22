import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { isAddressEqual, type Address } from 'viem'

export const sumActiveStake = (
  positions: StakingPosition[],
  wallet: Address | undefined,
) =>
  wallet === undefined
    ? BigInt(0)
    : positions
        .filter(
          ({ owner, status }) =>
            status === StakingPositionStatus.ACTIVE &&
            isAddressEqual(owner as Address, wallet),
        )
        .reduce((total, { amount }) => total + amount, BigInt(0))
