import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import { sumActiveStake } from '../../../../../app/[locale]/hemi-stake/_utils/walletStakedTotal'

const wallet = '0x99e3dE3817F6081B2568208337ef83295b7f591D' as Address
const someoneElse = '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28' as Address

const position = (
  amount: number,
  {
    owner = wallet,
    status = StakingPositionStatus.ACTIVE,
  }: { owner?: Address; status?: StakingPosition['status'] } = {},
) =>
  ({
    amount: BigInt(amount),
    owner,
    status,
  }) as StakingPosition

describe('sumActiveStake', function () {
  it('adds up the active positions the wallet owns', function () {
    expect(sumActiveStake([position(10), position(32)], wallet)).toBe(
      BigInt(42),
    )
  })

  it('leaves withdrawn positions out, their HEMI is back in the wallet', function () {
    expect(
      sumActiveStake(
        [
          position(10),
          position(500, { status: StakingPositionStatus.WITHDRAWN }),
        ],
        wallet,
      ),
    ).toBe(BigInt(10))
  })

  it('leaves out a position the wallet transferred away', function () {
    // The endpoint also returns locks this wallet only used to own, so an
    // active position now held by someone else is not part of its stake.
    expect(
      sumActiveStake(
        [position(10), position(500, { owner: someoneElse })],
        wallet,
      ),
    ).toBe(BigInt(10))
  })

  it('matches the owner regardless of casing', function () {
    expect(
      sumActiveStake(
        [position(10, { owner: wallet.toLowerCase() as Address })],
        wallet,
      ),
    ).toBe(BigInt(10))
  })

  it('returns zero without a connected wallet', function () {
    expect(sumActiveStake([position(10)], undefined)).toBe(BigInt(0))
  })

  it('handles an empty list', function () {
    expect(sumActiveStake([], wallet)).toBe(BigInt(0))
  })
})
