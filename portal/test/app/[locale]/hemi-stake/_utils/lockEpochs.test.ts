import {
  getEpochEnd,
  getPositionWeights,
  getLockEnd,
  getRelockedWeight,
  getWeightAt,
} from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { MaxLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const epochAlignedNow = SixDaysSeconds * 3232
const hemi = (amount: number) => BigInt(amount) * BigInt(1e18)
const epochs = (count: number) => epochAlignedNow + count * SixDaysSeconds

describe('getLockEnd', function () {
  it('rounds a real lock down to the epoch grid', function () {
    // Values of a position on Hemi mainnet: the contract stored 1771959240.
    expect(getLockEnd({ lockTime: 15778800, timestamp: 1756428611 })).toBe(
      1771959240,
    )
  })

  it('leaves an end that already sits on a boundary alone', function () {
    expect(
      getLockEnd({ lockTime: SixDaysSeconds * 4, timestamp: epochAlignedNow }),
    ).toBe(epochs(4))
  })

  it('lands 240 epochs out for the longest lock from a boundary', function () {
    expect(
      getLockEnd({
        lockTime: MaxLockDurationSeconds,
        timestamp: epochAlignedNow,
      }),
    ).toBe(epochs(240))
  })

  it('gives back nothing when the lock misses the next boundary', function () {
    expect(
      getLockEnd({ lockTime: SixDaysSeconds - 1, timestamp: epochAlignedNow }),
    ).toBe(epochAlignedNow)
  })

  it('drops the part of an epoch a mid-epoch lock cannot complete', function () {
    expect(
      getLockEnd({
        lockTime: SixDaysSeconds * 2,
        timestamp: epochAlignedNow + 1,
      }),
    ).toBe(epochs(2))
  })
})

describe('getEpochEnd', function () {
  it('settles the epoch in progress first, after a mid-epoch start', function () {
    expect(getEpochEnd({ epochsAhead: 0, now: epochAlignedNow + 1 })).toBe(
      epochs(1),
    )
  })

  // On mainnet each epoch settles at (epoch + 1) * epochLength, so `now` on a boundary
  // opens that epoch rather than closing it. Flip this and every payout shifts by one.
  it('settles a full epoch later when it starts on a boundary', function () {
    expect(getEpochEnd({ epochsAhead: 0, now: epochAlignedNow })).toBe(
      epochs(1),
    )
  })

  it('reaches the sixtieth boundary at the end of year one', function () {
    expect(getEpochEnd({ epochsAhead: 59, now: epochAlignedNow })).toBe(
      epochs(60),
    )
  })
})

describe('getWeightAt', function () {
  // The contract truncates the slope before multiplying, so even the longest lock
  // falls short of the amount by whatever the division dropped.
  it('is worth the amount less what the truncated slope drops', function () {
    expect(
      getWeightAt({
        amount: hemi(240),
        at: epochAlignedNow,
        lockEnd: epochs(240),
      }),
    ).toBe(hemi(240) - (hemi(240) % BigInt(MaxLockDurationSeconds)))
  })

  it('decays in a straight line, halving at the midpoint', function () {
    const atStart = getWeightAt({
      amount: hemi(240),
      at: epochAlignedNow,
      lockEnd: epochs(240),
    })

    expect(
      getWeightAt({
        amount: hemi(240),
        at: epochs(120),
        lockEnd: epochs(240),
      }),
    ).toBe(atStart / BigInt(2))
  })

  // Position 29702 on Hemi mainnet, read with balanceOfNFTAt at that instant. This is
  // the case that catches the operation order drifting from the contract's.
  it('matches what the contract reports for a live position', function () {
    expect(
      getWeightAt({
        amount: BigInt('14505242825800000000000000'),
        at: 1790614080,
        lockEnd: 1792471680,
      }),
    ).toBe(BigInt('213458398873853523580800'))
  })

  it('is worth nothing at the unlock instant itself', function () {
    expect(
      getWeightAt({ amount: hemi(240), at: epochs(240), lockEnd: epochs(240) }),
    ).toBe(BigInt(0))
  })

  it('is worth nothing once the lock is over', function () {
    expect(
      getWeightAt({ amount: hemi(240), at: epochs(241), lockEnd: epochs(240) }),
    ).toBe(BigInt(0))
  })

  it('is worth nothing without an amount', function () {
    expect(
      getWeightAt({
        amount: BigInt(0),
        at: epochAlignedNow,
        lockEnd: epochs(240),
      }),
    ).toBe(BigInt(0))
  })
})

describe('getRelockedWeight', function () {
  const amount = hemi(50)
  const bucketStart = 1792471680
  const lockEnd = bucketStart + 60 * SixDaysSeconds
  const relocked = BigInt('12395833333322008500')

  it('matches what the contract holds a relocked position at', function () {
    expect(getRelockedWeight({ amount, lockEnd, now: bucketStart })).toBe(
      relocked,
    )
  })

  it.each([0, 1, 314_320, SixDaysSeconds - 1])(
    'does not move %i seconds into the epoch',
    function (elapsed) {
      expect(
        getRelockedWeight({ amount, lockEnd, now: bucketStart + elapsed }),
      ).toBe(relocked)
    },
  )

  it('is worth half an epoch less than the peak of the bucket', function () {
    const peak = getWeightAt({ amount, at: bucketStart, lockEnd })

    expect(peak - relocked).toBe(
      (amount / BigInt(MaxLockDurationSeconds)) * BigInt(SixDaysSeconds / 2),
    )
  })

  it('is worth nothing once the lock ends within the epoch', function () {
    expect(
      getRelockedWeight({ amount, lockEnd: bucketStart, now: bucketStart }),
    ).toBe(BigInt(0))
  })
})

describe('getPositionWeights', function () {
  const amount = hemi(50)
  const bucketStart = 1792471680
  const lockEnd = bucketStart + 60 * SixDaysSeconds
  const midEpoch = bucketStart + 314_320

  const weights = ({ autoRelock, fromChain = undefined, now }) =>
    getPositionWeights({ amount, autoRelock, fromChain, lockEnd, now })

  it('holds a relocked position flat across the epoch', function () {
    expect(weights({ autoRelock: true, now: midEpoch }).current).toBe(
      weights({ autoRelock: true, now: bucketStart }).current,
    )
  })

  it('decays a position that is not relocked', function () {
    expect(weights({ autoRelock: false, now: midEpoch }).current).toBe(
      getWeightAt({ amount, at: midEpoch, lockEnd }),
    )
    expect(weights({ autoRelock: false, now: midEpoch }).current).toBeLessThan(
      weights({ autoRelock: false, now: bucketStart }).current,
    )
  })

  it('always holds the relocked weight at the epoch mean', function () {
    expect(weights({ autoRelock: false, now: midEpoch }).relocked).toBe(
      getRelockedWeight({ amount, lockEnd, now: midEpoch }),
    )
  })

  describe('the current weight of a lock that is not relocked', function () {
    // The contract stores lock ends on the epoch grid, so a lock that starts on a
    // boundary keeps every second it paid for and the arithmetic below stays exact.
    const mockNow = epochAlignedNow
    const thousand = hemi(1_000)
    // The contract truncates amount / MAX_TIME once and multiplies after, so no lock is
    // ever worth the full amount.
    const thousandSlope = thousand / BigInt(MaxLockDurationSeconds)
    const currentWeight = ({
      amount: locked = thousand,
      lockTime,
      now = mockNow,
      timestamp = mockNow,
    }) =>
      getPositionWeights({
        amount: locked,
        autoRelock: false,
        fromChain: undefined,
        lockEnd: getLockEnd({ lockTime, timestamp }),
        now,
      }).current

    it('discards the epoch a lock cannot complete', function () {
      // Starting 100 seconds early costs the lock its sixtieth epoch entirely.
      expect(
        currentWeight({
          lockTime: SixDaysSeconds * 60,
          timestamp: mockNow - 100,
        }),
      ).toBe(thousandSlope * BigInt(SixDaysSeconds * 59))
    })

    it('is worth the effective remainder for an armed position', function () {
      expect(
        getPositionWeights({
          amount: thousand,
          autoRelock: false,
          fromChain: undefined,
          lockEnd: mockNow + SixDaysSeconds * 10,
          now: mockNow,
        }).current,
      ).toBe(thousandSlope * BigInt(SixDaysSeconds * 10))
    })

    it('is worth nothing for an expired position', function () {
      expect(currentWeight({ lockTime: 100, timestamp: mockNow - 200 })).toBe(
        BigInt(0),
      )
    })

    it('is worth nothing when the amount is 0', function () {
      expect(
        currentWeight({ amount: BigInt(0), lockTime: 365 * 24 * 60 * 60 }),
      ).toBe(BigInt(0))
    })

    it('is worth all but the truncated remainder for a 4 year lock', function () {
      expect(currentWeight({ lockTime: MaxLockDurationSeconds })).toBe(
        thousandSlope * BigInt(MaxLockDurationSeconds),
      )
    })

    it('is worth half the amount for a 2 year lock at start', function () {
      const twoYears = MaxLockDurationSeconds / 2

      expect(currentWeight({ lockTime: twoYears })).toBe(
        thousandSlope * BigInt(twoYears),
      )
    })

    it('gives up the part of the final epoch the contract rounds away', function () {
      expect(
        currentWeight({
          lockTime: MaxLockDurationSeconds,
          now: mockNow + 1,
          timestamp: mockNow + 1,
        }),
      ).toBeLessThan(thousand)
    })

    it('is worth nothing when the lock misses the next epoch boundary', function () {
      expect(
        currentWeight({
          lockTime: 100,
          now: mockNow + 1,
          timestamp: mockNow + 1,
        }),
      ).toBe(BigInt(0))
    })
  })

  it('prefers what the contract reported over the local model', function () {
    const fromChain = { current: hemi(1), relocked: hemi(2) }

    expect(weights({ autoRelock: false, fromChain, now: midEpoch })).toEqual(
      fromChain,
    )
  })
})
