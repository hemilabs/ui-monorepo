import {
  toPayoutBars,
  toVotingPowerCurve,
} from 'app/[locale]/hemi-stake/estimator/_utils/projectionSeries'
import { describe, expect, it } from 'vitest'

const decimals = 18
const hemi = (amount: number) => BigInt(amount) * BigInt(1e18)
const lockEnd = 1_800_000_000

const epochs = [
  { payout: hemi(10), timestamp: lockEnd - 1_051_920, weight: hemi(300) },
  { payout: hemi(6), timestamp: lockEnd - 525_960, weight: hemi(150) },
  { payout: hemi(2), timestamp: lockEnd, weight: BigInt(0) },
]

describe('toPayoutBars', function () {
  it('keeps the amounts untouched in hemi', function () {
    expect(
      toPayoutBars({
        decimals,
        lockEnd,
        payouts: epochs,
        unit: 'hemi',
        usdPrice: 0.5,
      }).map(point => point.y),
    ).toEqual([10, 6, 2])
  })

  it('prices every bar when the unit is usd', function () {
    expect(
      toPayoutBars({
        decimals,
        lockEnd,
        payouts: epochs,
        unit: 'usd',
        usdPrice: 0.5,
      }).map(point => point.y),
    ).toEqual([5, 3, 1])
  })

  it('flags the epochs that settle at or past the unlock', function () {
    expect(
      toPayoutBars({
        decimals,
        lockEnd,
        payouts: epochs,
        unit: 'hemi',
        usdPrice: 1,
      }).map(point => point.afterUnlock),
    ).toEqual([false, false, true])
  })

  it('puts the timestamps in milliseconds', function () {
    const [first] = toPayoutBars({
      decimals,
      lockEnd,
      payouts: epochs,
      unit: 'hemi',
      usdPrice: 1,
    })

    expect(first.x).toBe(epochs[0].timestamp * 1000)
  })
})

describe('toVotingPowerCurve', function () {
  it('plots the weight, not the payout', function () {
    expect(
      toVotingPowerCurve({ decimals, payouts: epochs }).map(point => point.y),
    ).toEqual([300, 150, 0])
  })

  it('is empty without epochs', function () {
    expect(toVotingPowerCurve({ decimals, payouts: [] })).toEqual([])
  })
})
