import {
  getPayoutAxisTicks,
  getUnlockMarkerX,
  toPayoutSeries,
} from 'app/[locale]/hemi-stake/_utils/payoutsChartData'
import { describe, expect, it } from 'vitest'

const epochLength = 525_960

const payout = (epochsAhead: number, amount: bigint) => ({
  payout: amount,
  timestamp: (epochsAhead + 1) * epochLength,
})

describe('toPayoutSeries', function () {
  it('puts the epoch close on the x axis, in milliseconds', function () {
    const [point] = toPayoutSeries({
      decimals: 18,
      lockEnd: Number.MAX_SAFE_INTEGER,
      payouts: [payout(0, BigInt(0))],
    })

    expect(point.x).toBe(epochLength * 1000)
  })

  it('converts the payout out of wei', function () {
    const [point] = toPayoutSeries({
      decimals: 18,
      lockEnd: Number.MAX_SAFE_INTEGER,
      payouts: [payout(0, BigInt('1764000000000000000000'))],
    })

    expect(point.y).toBe(1764)
  })

  it('marks every epoch that closes on or after the lock end', function () {
    const series = toPayoutSeries({
      decimals: 18,
      lockEnd: 3 * epochLength,
      payouts: [
        payout(0, BigInt(3)),
        payout(1, BigInt(2)),
        payout(2, BigInt(0)),
        payout(3, BigInt(0)),
      ],
    })

    expect(series.map(point => point.afterUnlock)).toEqual([
      false,
      false,
      true,
      true,
    ])
  })

  it('leaves nothing after the unlock when the lock outlives the window', function () {
    const series = toPayoutSeries({
      decimals: 18,
      lockEnd: Number.MAX_SAFE_INTEGER,
      payouts: [payout(0, BigInt(3)), payout(1, BigInt(2))],
    })

    expect(series.some(point => point.afterUnlock)).toBe(false)
    expect(getUnlockMarkerX(series)).toBeUndefined()
  })
})

describe('getUnlockMarkerX', function () {
  it('points at the first epoch that closes past the lock end', function () {
    const series = toPayoutSeries({
      decimals: 18,
      lockEnd: 2 * epochLength,
      payouts: [
        payout(0, BigInt(3)),
        payout(1, BigInt(0)),
        payout(2, BigInt(0)),
      ],
    })

    expect(getUnlockMarkerX(series)).toBe(2 * epochLength * 1000)
  })
})

describe('getPayoutAxisTicks', function () {
  it('takes the start, the middle and the end', function () {
    const series = toPayoutSeries({
      decimals: 18,
      lockEnd: Number.MAX_SAFE_INTEGER,
      payouts: [
        payout(0, BigInt(0)),
        payout(1, BigInt(0)),
        payout(2, BigInt(0)),
        payout(3, BigInt(0)),
        payout(4, BigInt(0)),
      ],
    })

    expect(getPayoutAxisTicks(series)).toEqual([
      1 * epochLength * 1000,
      3 * epochLength * 1000,
      5 * epochLength * 1000,
    ])
  })

  it('does not repeat a tick when the series is too short to have three', function () {
    const series = toPayoutSeries({
      decimals: 18,
      lockEnd: Number.MAX_SAFE_INTEGER,
      payouts: [payout(0, BigInt(0)), payout(1, BigInt(0))],
    })

    expect(getPayoutAxisTicks(series)).toEqual([
      1 * epochLength * 1000,
      2 * epochLength * 1000,
    ])
  })

  it('has no tick to offer for an empty series', function () {
    expect(getPayoutAxisTicks([])).toEqual([])
  })
})
