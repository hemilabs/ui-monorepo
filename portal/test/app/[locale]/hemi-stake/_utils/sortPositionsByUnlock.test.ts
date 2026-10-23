import { sortPositionsByUnlock } from 'app/[locale]/hemi-stake/_utils/sortPositionsByUnlock'
import { SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const epochAlignedStart = SixDaysSeconds * 3232

const position = ({
  effectiveLockEnd,
  epochs,
  tokenId,
}: {
  effectiveLockEnd?: bigint
  epochs: number
  tokenId: number
}) =>
  ({
    effectiveLockEnd,
    lockTime: BigInt(SixDaysSeconds * epochs),
    timestamp: BigInt(epochAlignedStart),
    tokenId: BigInt(tokenId),
  }) as never

const ids = positions => positions.map(({ tokenId }) => Number(tokenId))

describe('sortPositionsByUnlock', function () {
  it('puts the position that unlocks first at the front', function () {
    const sorted = sortPositionsByUnlock([
      position({ epochs: 60, tokenId: 1 }),
      position({ epochs: 10, tokenId: 2 }),
      position({ epochs: 30, tokenId: 3 }),
    ])

    expect(ids(sorted)).toEqual([2, 3, 1])
  })

  it('places an armed position by its effective end, not its stored one', function () {
    const sorted = sortPositionsByUnlock([
      position({ epochs: 20, tokenId: 1 }),
      position({
        effectiveLockEnd: BigInt(epochAlignedStart + SixDaysSeconds * 90),
        epochs: 5,
        tokenId: 2,
      }),
      position({ epochs: 40, tokenId: 3 }),
    ])

    expect(ids(sorted)).toEqual([1, 3, 2])
  })

  it('leaves the given array untouched', function () {
    const positions = [
      position({ epochs: 60, tokenId: 1 }),
      position({ epochs: 10, tokenId: 2 }),
    ]

    sortPositionsByUnlock(positions)

    expect(ids(positions)).toEqual([1, 2])
  })
})
