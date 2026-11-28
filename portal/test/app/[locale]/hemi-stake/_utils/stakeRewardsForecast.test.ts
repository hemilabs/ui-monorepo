import {
  getEpochEnd,
  getLockEnd,
  getWeightAt,
} from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { emptyInputsByClass } from 'app/[locale]/hemi-stake/_utils/rewardClass'
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

// A four-year lock of 240 HEMI from a boundary is worth about 239 HEMI at the close of
// the epoch in progress, because the longest lock spans exactly 240 epochs. Against a
// class of 761 HEMI the denominator lands on 1000, so a baseline of 1000 pays about 239.
const golden = {
  amount: hemi(240),
  inputsByClass: {
    forfeitable: { baseline: hemi(7), weight: hemi(13) },
    locked: { baseline: hemi(29), weight: hemi(31) },
    transferable: { baseline: hemi(1000), weight: hemi(761) },
  },
  lockDurationInSeconds: MaxLockDurationSeconds,
  now: epochAlignedNow,
}

const forecast = (overrides = {}) =>
  getRewardsForecast({ ...golden, ...overrides })

describe('getEpochPayout', function () {
  it('takes the whole baseline when it is the only weight in the class', function () {
    expect(
      getEpochPayout({
        baseline: hemi(1000),
        classWeight: BigInt(0),
        weight: hemi(5),
      }),
    ).toBe(hemi(1000))
  })

  it('takes half the baseline when it matches the rest of the class', function () {
    expect(
      getEpochPayout({
        baseline: hemi(1000),
        classWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(hemi(500))
  })

  it('pays nothing without weight', function () {
    expect(
      getEpochPayout({
        baseline: hemi(1000),
        classWeight: hemi(50),
        weight: BigInt(0),
      }),
    ).toBe(BigInt(0))
  })

  it('pays nothing out of an empty baseline', function () {
    expect(
      getEpochPayout({
        baseline: BigInt(0),
        classWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(BigInt(0))
  })

  it('does not divide by zero on an empty class', function () {
    expect(
      getEpochPayout({
        baseline: hemi(1000),
        classWeight: BigInt(0),
        weight: BigInt(0),
      }),
    ).toBe(BigInt(0))
  })

  it('does not pay double for double the weight, the stake dilutes itself', function () {
    const single = getEpochPayout({
      baseline: hemi(1000),
      classWeight: hemi(100),
      weight: hemi(100),
    })
    const doubled = getEpochPayout({
      baseline: hemi(1000),
      classWeight: hemi(100),
      weight: hemi(200),
    })
    expect(doubled).toBeLessThan(single * BigInt(2))
  })
})

describe('getWeightShare', function () {
  it('is half when the stake matches the rest of the class', function () {
    expect(
      getWeightShare({
        classWeight: hemi(50),
        weight: hemi(50),
      }),
    ).toBe(0.5)
  })

  it('is nothing without weight', function () {
    expect(getWeightShare({ classWeight: hemi(50), weight: BigInt(0) })).toBe(0)
  })

  it('is nothing rather than NaN when there is no weight at all', function () {
    expect(getWeightShare({ classWeight: BigInt(0), weight: BigInt(0) })).toBe(
      0,
    )
  })

  it('still resolves the smallest allowed stake against a millions-strong class', function () {
    expect(
      getWeightShare({
        classWeight: hemi(11_660_000),
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

  it('shares the baseline by weight against the class the stake joins', function () {
    // It lands just under the round 239 because the truncated slope loses under a wei
    // per second of lock, which caps the shortfall at MaxLockDurationSeconds wei.
    const { nextPayout } = forecast()
    expect(nextPayout).toBeLessThan(hemi(239))
    expect(hemi(239) - nextPayout).toBeLessThan(BigInt(MaxLockDurationSeconds))
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
    expect(forecast({ amount: BigInt(0) }).yearOneReturnRatio).toBe(0)
  })

  it('keeps a duration under the new lock floor as it was given', function () {
    const lockDurationInSeconds = 12 * 86_400
    expect(forecast({ lockDurationInSeconds }).lockEnd).toBe(
      getLockEnd({ lockTime: lockDurationInSeconds, timestamp: golden.now }),
    )
  })

  it('earns nothing once the lock ends before the first epoch close', function () {
    expect(forecast({ lockDurationInSeconds: 12 * 86_400 }).yearOneTotal).toBe(
      BigInt(0),
    )
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
  // epoch 3402's baseline. Every other test here only proves internal consistency; this one
  // is the only guard against the whole model drifting.
  it('reproduces the ladder the deployed simulator published', function () {
    const ratios = getRewardsForecastByLockDurations({
      amount: hemi(10_000),
      inputsByClass: {
        ...emptyInputsByClass,
        transferable: {
          baseline: BigInt('4166666660000000000000000'),
          weight: hemi(10_056_994),
        },
      },
      lockDurationsInSeconds: [
        days(365),
        days(730),
        days(1096),
        MaxLockDurationSeconds,
      ],
      now: SixDaysSeconds * 3402 + 43_200,
    }).map(({ yearOneReturnRatio }) => yearOneReturnRatio)

    expect(ratios[0]).toBeCloseTo(3.055, 2)
    expect(ratios[1]).toBeCloseTo(9.266, 2)
    expect(ratios[2]).toBeCloseTo(15.475, 2)
    expect(ratios[3]).toBeCloseTo(21.68, 2)
  })
})

describe('getRewardsForecast by reward class', function () {
  const switchesAt = 10
  const transferableAfter = getEpochEnd({
    epochsAhead: switchesAt,
    now: epochAlignedNow,
  })
  const locked = { forfeitable: false, transferableAfter }

  it('draws from its own class until it becomes transferable', function () {
    expect(
      forecast({ positionClass: locked }).payouts.map(
        ({ rewardClass }) => rewardClass,
      ),
    ).toEqual([
      ...Array.from({ length: switchesAt }, () => 'locked'),
      ...Array.from({ length: 60 - switchesAt }, () => 'transferable'),
    ])
  })

  it('switches pot exactly at the instant it becomes transferable', function () {
    const { payouts } = forecast({ positionClass: locked })

    expect(payouts[switchesAt - 1].payout).toBe(
      getEpochPayout({
        baseline: golden.inputsByClass.locked.baseline,
        classWeight: golden.inputsByClass.locked.weight,
        weight: payouts[switchesAt - 1].weight,
      }),
    )
    expect(payouts[switchesAt].payout).toBe(
      getEpochPayout({
        baseline: golden.inputsByClass.transferable.baseline,
        classWeight: golden.inputsByClass.transferable.weight,
        weight: payouts[switchesAt].weight,
      }),
    )
  })

  it('prices a forfeitable position out of the forfeitable pot', function () {
    const { payouts } = forecast({
      positionClass: {
        forfeitable: true,
        transferableAfter: Number.MAX_SAFE_INTEGER,
      },
    })

    expect(
      payouts.every(({ rewardClass }) => rewardClass === 'forfeitable'),
    ).toBe(true)
    expect(payouts[0].payout).toBe(
      getEpochPayout({
        baseline: golden.inputsByClass.forfeitable.baseline,
        classWeight: golden.inputsByClass.forfeitable.weight,
        weight: payouts[0].weight,
      }),
    )
  })

  it('pays nothing out of a class nobody funded, then pays once it turns transferable', function () {
    const { payouts } = forecast({
      inputsByClass: {
        ...golden.inputsByClass,
        locked: { weight: golden.inputsByClass.locked.weight },
      },
      positionClass: locked,
    })

    expect(payouts.slice(0, switchesAt).map(({ payout }) => payout)).toEqual(
      Array.from({ length: switchesAt }, () => BigInt(0)),
    )
    expect(payouts[switchesAt].payout > BigInt(0)).toBe(true)
  })

  it('prices the position the form creates exactly as a transferable one', function () {
    expect(forecast()).toEqual(
      forecast({
        positionClass: { forfeitable: false, transferableAfter: 0 },
      }),
    )
  })

  it('switches pot at the same instant with auto-relock on', function () {
    expect(
      getRewardsForecast({
        ...golden,
        autoRelock: true,
        positionClass: locked,
      }).payouts.map(({ rewardClass }) => rewardClass),
    ).toEqual(
      forecast({ positionClass: locked }).payouts.map(
        ({ rewardClass }) => rewardClass,
      ),
    )
  })
})

describe('getRewardsForecast with auto-relock', function () {
  const relocked = (overrides = {}) =>
    forecast({ autoRelock: true, ...overrides })
  const midEpochNow = epochAlignedNow + days(5)
  const epochsInMaxLock = 240

  it('carries the same weight through every epoch of the year', function () {
    const { payouts } = relocked()
    payouts.forEach(({ weight }) => expect(weight).toBe(payouts[0].weight))
  })

  it('keeps all but half an epoch of a maximum lock, forever', function () {
    const { payouts } = relocked({ now: midEpochNow })
    expect(payouts[0].weight).toBe(
      (golden.amount / BigInt(MaxLockDurationSeconds)) *
        BigInt(epochsInMaxLock * SixDaysSeconds - SixDaysSeconds / 2),
    )
  })

  it('estimates the same year wherever in the epoch a whole-epoch lock starts', function () {
    expect(relocked({ now: midEpochNow }).yearOneTotal).toBe(
      relocked().yearOneTotal,
    )
  })

  it('rides the lock end just like the decaying forecast does', function () {
    // 180 days buys 29 whole epochs from a boundary and 30 from mid-epoch,
    // because the lock end snaps. Both modes move with it.
    const lockDurationInSeconds = days(180)
    const later = { lockDurationInSeconds, now: midEpochNow }
    const sooner = { lockDurationInSeconds }

    expect(relocked(later).yearOneTotal).toBeGreaterThan(
      relocked(sooner).yearOneTotal,
    )
    expect(forecast(later).yearOneTotal).toBeGreaterThan(
      forecast(sooner).yearOneTotal,
    )
  })

  it('matches extending the lock by one epoch every epoch', function () {
    const lockDurationInSeconds = days(366)
    const lockEnd = getLockEnd({
      lockTime: lockDurationInSeconds,
      timestamp: epochAlignedNow,
    })
    const extended = Array.from({ length: 60 }, (_, epochsAhead) =>
      getEpochPayout({
        baseline: golden.inputsByClass.transferable.baseline,
        classWeight: golden.inputsByClass.transferable.weight,
        weight: getWeightAt({
          amount: golden.amount,
          at:
            getEpochEnd({ epochsAhead, now: epochAlignedNow }) +
            SixDaysSeconds / 2,
          lockEnd: lockEnd + (epochsAhead + 1) * SixDaysSeconds,
        }),
      }),
    )
    expect(
      relocked({ lockDurationInSeconds }).payouts.map(({ payout }) => payout),
    ).toEqual(extended)
  })

  it('carries a weight read off the contract through every epoch', function () {
    const { payouts } = relocked({ relockedWeight: hemi(7) })

    payouts.forEach(({ weight }) => expect(weight).toBe(hemi(7)))
  })

  it('ignores a weight read off the contract while decaying', function () {
    expect(forecast({ relockedWeight: hemi(7) }).payouts).toEqual(
      forecast().payouts,
    )
  })

  it('keeps paying past the end of the lock', function () {
    const { payouts } = relocked({ lockDurationInSeconds: SixDaysSeconds * 10 })
    expect(payouts.filter(({ payout }) => payout > BigInt(0))).toHaveLength(60)
  })

  it('never carries the whole amount as weight on a shorter lock', function () {
    relocked({ lockDurationInSeconds: days(366) }).payouts.forEach(
      ({ weight }) =>
        expect(
          getLockMultiplier({ amount: golden.amount, weight }),
        ).toBeLessThan(1),
    )
  })

  it('still earns more for a longer lock', function () {
    const totals = getRewardsForecastByLockDurations({
      ...golden,
      autoRelock: true,
      lockDurationsInSeconds: [days(180), days(366), days(732), days(1461)],
    }).map(({ yearOneTotal }) => yearOneTotal)
    totals.slice(1).forEach(function (total, index) {
      expect(total).toBeGreaterThan(totals[index])
    })
  })

  it('leaves the decaying forecast alone when it is off', function () {
    expect(forecast({ autoRelock: false })).toEqual(forecast())
  })
})
