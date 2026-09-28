import {
  getEpochPayout,
  getLockMultiplier,
  getRewardsForecast,
  getRewardsForecastByLockDurations,
  getWeightShare,
} from 'app/[locale]/hemi-stake/_utils/stakeRewardsForecast'
import {
  MaxLockDurationSeconds,
  minLockAmount,
  SixDaysSeconds,
} from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const epochAlignedNow = SixDaysSeconds * 3232
const hemi = (amount: number) => BigInt(amount) * BigInt(1e18)
const days = (count: number) => count * 86_400

// A four-year lock of 240 HEMI from a boundary is worth 239 HEMI at the close of the
// epoch in progress, because the longest lock spans exactly 240 epochs. Against a class
// of 761 HEMI the denominator lands on 1000, so a pot of 1000 pays exactly 239.
const golden = {
  amount: hemi(240),
  lockDurationInSeconds: MaxLockDurationSeconds,
  now: epochAlignedNow,
  transferableClassPot: hemi(1000),
  transferableClassWeight: hemi(761),
}

const forecast = (overrides = {}) =>
  getRewardsForecast({ ...golden, ...overrides })

describe('getEpochPayout', function () {
  it('takes the whole pot when it is the only weight in the class', function () {
    expect(
      getEpochPayout({
        transferableClassPot: hemi(1000),
        transferableClassWeight: BigInt(0),
        weight: hemi(5),
      }),
    ).toBe(hemi(1000))
  })

  it('takes half the pot when it matches the rest of the class', function () {
    expect(
      getEpochPayout({
        transferableClassPot: hemi(1000),
        transferableClassWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(hemi(500))
  })

  it('pays nothing without weight', function () {
    expect(
      getEpochPayout({
        transferableClassPot: hemi(1000),
        transferableClassWeight: hemi(50),
        weight: BigInt(0),
      }),
    ).toBe(BigInt(0))
  })

  it('pays nothing out of an empty pot', function () {
    expect(
      getEpochPayout({
        transferableClassPot: BigInt(0),
        transferableClassWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(BigInt(0))
  })

  it('does not divide by zero on an empty class', function () {
    expect(
      getEpochPayout({
        transferableClassPot: hemi(1000),
        transferableClassWeight: BigInt(0),
        weight: BigInt(0),
      }),
    ).toBe(BigInt(0))
  })

  it('does not pay double for double the weight, the stake dilutes itself', function () {
    const single = getEpochPayout({
      transferableClassPot: hemi(1000),
      transferableClassWeight: hemi(100),
      weight: hemi(100),
    })
    const doubled = getEpochPayout({
      transferableClassPot: hemi(1000),
      transferableClassWeight: hemi(100),
      weight: hemi(200),
    })
    expect(doubled).toBeLessThan(single * BigInt(2))
  })
})

describe('getWeightShare', function () {
  it('is half when the stake matches the rest of the class', function () {
    expect(
      getWeightShare({
        transferableClassWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(0.5)
  })

  it('is nothing without weight', function () {
    expect(
      getWeightShare({ transferableClassWeight: hemi(50), weight: BigInt(0) }),
    ).toBe(0)
  })

  it('is nothing rather than NaN when there is no weight at all', function () {
    expect(
      getWeightShare({ transferableClassWeight: BigInt(0), weight: BigInt(0) }),
    ).toBe(0)
  })

  it('still resolves the smallest allowed stake against a millions-strong class', function () {
    expect(
      getWeightShare({
        transferableClassWeight: hemi(11_660_000),
        weight: minLockAmount,
      }),
    ).toBeGreaterThan(0)
  })
})

describe('getLockMultiplier', function () {
  it('is one when the longest lock starts on a boundary', function () {
    expect(getLockMultiplier({ amount: hemi(10), weight: hemi(10) })).toBe(1)
  })

  it('is a quarter for a lock lasting a quarter of the maximum', function () {
    expect(getLockMultiplier({ amount: hemi(1000), weight: hemi(250) })).toBe(
      0.25,
    )
  })

  it('is nothing once the lock is over', function () {
    expect(getLockMultiplier({ amount: hemi(1000), weight: BigInt(0) })).toBe(0)
  })

  it('is nothing rather than NaN without an amount', function () {
    expect(getLockMultiplier({ amount: BigInt(0), weight: BigInt(0) })).toBe(0)
  })
})

describe('getRewardsForecast', function () {
  it('prices one epoch for every epoch of the first year', function () {
    expect(forecast().payouts).toHaveLength(60)
  })

  it('pays for the first time at the close of the epoch in progress', function () {
    expect(forecast().payouts[0].timestamp).toBe(
      epochAlignedNow + SixDaysSeconds,
    )
  })

  it('shares the pot by weight against the class the stake joins', function () {
    expect(forecast().nextPayout).toBe(hemi(239))
  })

  it('reports the first epoch as the next payout', function () {
    const { nextPayout, payouts } = forecast()
    expect(nextPayout).toBe(payouts[0].payout)
  })

  it('adds the whole year up into the total', function () {
    const { payouts, yearOneTotal } = forecast()
    expect(yearOneTotal).toBe(
      payouts.reduce((total, { payout }) => total + payout, BigInt(0)),
    )
  })

  it('never pays more in a later epoch than in an earlier one', function () {
    const { payouts } = forecast()
    payouts.slice(1).forEach(function ({ payout }, index) {
      expect(payout).toBeLessThanOrEqual(payouts[index].payout)
    })
  })

  it('keeps earning through the last epoch of a four-year lock', function () {
    forecast().payouts.forEach(({ payout }) =>
      expect(payout).toBeGreaterThan(0),
    )
  })

  it('stops paying an epoch before the lock ends', function () {
    const { payouts } = forecast({
      lockDurationInSeconds: SixDaysSeconds * 10,
    })
    expect(payouts.filter(({ payout }) => payout > BigInt(0))).toHaveLength(9)
  })

  it('pays a single epoch for the shortest lock the contract takes', function () {
    const { payouts } = forecast({ lockDurationInSeconds: SixDaysSeconds * 2 })
    expect(payouts.filter(({ payout }) => payout > BigInt(0))).toHaveLength(1)
  })

  it('pays nothing at all when the lock misses the next boundary', function () {
    const { yearOneTotal } = forecast({
      lockDurationInSeconds: SixDaysSeconds - 1,
    })
    expect(yearOneTotal).toBe(BigInt(0))
  })

  it('turns the minimum amount down one wei short of it', function () {
    expect(
      forecast({ amount: minLockAmount - BigInt(1) }).meetsMinimumAmount,
    ).toBe(false)
  })

  it('accepts exactly the minimum amount', function () {
    expect(forecast({ amount: minLockAmount }).meetsMinimumAmount).toBe(true)
  })

  it('still prices an amount the contract would reject', function () {
    const { meetsMinimumAmount, yearOneTotal } = forecast({
      amount: minLockAmount - BigInt(1),
    })
    expect(meetsMinimumAmount).toBe(false)
    expect(yearOneTotal).toBeGreaterThan(BigInt(0))
  })

  it('does not pay double for double the stake', function () {
    expect(forecast({ amount: hemi(480) }).yearOneTotal).toBeLessThan(
      forecast().yearOneTotal * BigInt(2),
    )
  })

  it('has no yield rather than an infinite one without an amount', function () {
    expect(forecast({ amount: BigInt(0) }).yearOneApy).toBe(0)
  })

  it('prices a duration past the cap as the longest lock allowed', function () {
    expect(
      forecast({ lockDurationInSeconds: MaxLockDurationSeconds * 2 })
        .yearOneTotal,
    ).toBe(forecast().yearOneTotal)
  })

  it('never carries more weight than the amount locked', function () {
    const { payouts } = forecast({
      lockDurationInSeconds: MaxLockDurationSeconds * 2,
    })
    payouts.forEach(({ weight }) =>
      expect(
        getLockMultiplier({ amount: golden.amount, weight }),
      ).toBeLessThanOrEqual(1),
    )
  })
})

describe('getRewardsForecastByLockDurations', function () {
  const ladder = (lockDurationsInSeconds: number[]) =>
    getRewardsForecastByLockDurations({ ...golden, lockDurationsInSeconds })

  it('keeps the durations it was given, in order', function () {
    expect(
      ladder([days(365), days(730)]).map(
        ({ lockDurationInSeconds }) => lockDurationInSeconds,
      ),
    ).toEqual([days(365), days(730)])
  })

  it('never earns less in a year by locking for longer', function () {
    const totals = ladder([
      days(365),
      days(730),
      days(1096),
      MaxLockDurationSeconds,
    ]).map(({ yearOneTotal }) => yearOneTotal)
    totals.slice(1).forEach(function (total, index) {
      expect(total).toBeGreaterThan(totals[index])
    })
  })

  it('has nothing to price without durations', function () {
    expect(ladder([])).toEqual([])
  })

  it('matches pricing a single duration on its own', function () {
    expect(ladder([MaxLockDurationSeconds])[0].yearOneTotal).toBe(
      forecast().yearOneTotal,
    )
  })

  // The ladder the deployed simulator at hemistake.hemi.xyz showed for 10,000 HEMI on
  // epoch 3402's pot. Every other test here only proves internal consistency; this one
  // is the only guard against the whole model drifting.
  it('reproduces the ladder the deployed simulator published', function () {
    const apys = getRewardsForecastByLockDurations({
      amount: hemi(10_000),
      lockDurationsInSeconds: [
        days(365),
        days(730),
        days(1096),
        MaxLockDurationSeconds,
      ],
      now: SixDaysSeconds * 3402 + 43_200,
      transferableClassPot: BigInt('4166666660000000000000000'),
      transferableClassWeight: hemi(10_056_994),
    }).map(({ yearOneApy }) => yearOneApy)

    expect(apys[0]).toBeCloseTo(3.055, 2)
    expect(apys[1]).toBeCloseTo(9.266, 2)
    expect(apys[2]).toBeCloseTo(15.475, 2)
    expect(apys[3]).toBeCloseTo(21.68, 2)
  })
})
