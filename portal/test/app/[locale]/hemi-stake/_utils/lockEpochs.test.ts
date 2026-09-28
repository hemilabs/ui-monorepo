import {
  getEpochEnd,
  getLockEnd,
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

  // On mainnet each pot settles at (epoch + 1) * epochLength, so `now` on a boundary
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
  it('is worth the whole amount when the longest lock starts', function () {
    expect(
      getWeightAt({
        amount: hemi(240),
        at: epochAlignedNow,
        lockEnd: epochs(240),
      }),
    ).toBe(hemi(240))
  })

  it('decays in a straight line, halving at the midpoint', function () {
    expect(
      getWeightAt({
        amount: hemi(240),
        at: epochs(120),
        lockEnd: epochs(240),
      }),
    ).toBe(hemi(120))
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
