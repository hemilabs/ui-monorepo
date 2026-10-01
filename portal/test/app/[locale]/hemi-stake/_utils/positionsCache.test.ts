import { type StakingPosition } from 'types/stakingDashboard'
import { describe, expect, it } from 'vitest'

import {
  prependPosition,
  updatePosition,
} from '../../../../../app/[locale]/hemi-stake/_utils/positionsCache'

const position = (tokenId: number) =>
  ({ amount: BigInt(10), tokenId: BigInt(tokenId) }) as StakingPosition

const addAmount = (stakingPosition: StakingPosition) => ({
  ...stakingPosition,
  amount: stakingPosition.amount + BigInt(5),
})

describe('prependPosition', function () {
  it('adds the new position first', function () {
    expect(prependPosition(position(3))([position(1), position(2)])).toEqual([
      position(3),
      position(1),
      position(2),
    ])
  })

  it('keeps the list when the position is already in it', function () {
    const positions = [position(1), position(3)]
    expect(prependPosition(position(3))(positions)).toBe(positions)
  })

  it('returns undefined when there is no cached list', function () {
    expect(prependPosition(position(3))(undefined)).toBeUndefined()
  })
})

describe('updatePosition', function () {
  it('updates only the position with the given tokenId', function () {
    expect(
      updatePosition({ tokenId: BigInt(2), update: addAmount })([
        position(1),
        position(2),
      ]),
    ).toEqual([position(1), { ...position(2), amount: BigInt(15) }])
  })

  it('returns undefined when there is no cached list', function () {
    expect(
      updatePosition({ tokenId: BigInt(2), update: addAmount })(undefined),
    ).toBeUndefined()
  })
})
