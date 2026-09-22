import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { describe, expect, it } from 'vitest'

import { sumActiveStake } from '../../../../../app/[locale]/hemi-stake/_utils/walletStakedTotal'

const position = (
  amount: number,
  status: StakingPosition['status'] = StakingPositionStatus.ACTIVE,
) =>
  ({
    amount: BigInt(amount),
    status,
  }) as StakingPosition

describe('sumActiveStake', function () {
  it('adds up the active positions', function () {
    expect(sumActiveStake([position(10), position(32)])).toBe(BigInt(42))
  })

  it('leaves withdrawn positions out, their HEMI is back in the wallet', function () {
    expect(
      sumActiveStake([
        position(10),
        position(500, StakingPositionStatus.WITHDRAWN),
      ]),
    ).toBe(BigInt(10))
  })

  it('returns zero when every position was withdrawn', function () {
    expect(
      sumActiveStake([position(10, StakingPositionStatus.WITHDRAWN)]),
    ).toBe(BigInt(0))
  })

  it('handles an empty list', function () {
    expect(sumActiveStake([])).toBe(BigInt(0))
  })
})
