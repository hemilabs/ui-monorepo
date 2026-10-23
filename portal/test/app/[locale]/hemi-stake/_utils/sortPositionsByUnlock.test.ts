import { sortPositionsByUnlock } from 'app/[locale]/hemi-stake/_utils/sortPositionsByUnlock'
import { SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const epochAlignedStart = SixDaysSeconds * 3232

const position = ({ epochs, tokenId }: { epochs: number; tokenId: number }) =>
  ({
    effectiveLockEnd: BigInt(epochAlignedStart + SixDaysSeconds * epochs),
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

  it('keeps a stable order when two positions end on the same epoch', function () {
    const sorted = sortPositionsByUnlock([
      position({ epochs: 30, tokenId: 1 }),
      position({ epochs: 10, tokenId: 2 }),
      position({ epochs: 30, tokenId: 3 }),
    ])

    expect(ids(sorted)).toEqual([2, 1, 3])
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
