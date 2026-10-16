import { getAutoRelockComparison } from 'app/[locale]/hemi-stake/_utils/autoRelockComparison'
import {
  getEpochEnd,
  getWeightAt,
} from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import {
  alwaysTransferable,
  emptyInputsByClass,
  type InputsByClass,
  type PositionClass,
} from 'app/[locale]/hemi-stake/_utils/rewardClass'
import { getEpochPayout } from 'app/[locale]/hemi-stake/_utils/stakeRewardsForecast'
import { SixDaysSeconds, snapToEpoch } from 've-hemi-actions'
import { formatUnits } from 'viem'
import { describe, expect, it } from 'vitest'

const decimals = 18
const oneToken = BigInt(10) ** BigInt(decimals)
const amount = BigInt(1_000) * oneToken
const baseline = BigInt(500) * oneToken

// Early in an epoch, so the snapped anchor and the epoch close differ.
const now = SixDaysSeconds * 3_000 + 1_000
const lockDurationInSeconds = SixDaysSeconds * 60
const unlockTime = snapToEpoch(now + lockDurationInSeconds)

const weightAtEpochClose = getWeightAt({
  amount,
  at: getEpochEnd({ epochsAhead: 0, now }),
  lockEnd: unlockTime,
})
const weightAtEpochStart = getWeightAt({
  amount,
  at: snapToEpoch(now),
  lockEnd: unlockTime,
})

const transferableOnly = (weight: bigint) => ({
  ...emptyInputsByClass,
  transferable: { baseline, weight },
})

const compare = ({
  autoRelock,
  inputsByClass,
  lockEnd = unlockTime,
  positionClass = alwaysTransferable,
}: {
  autoRelock: boolean
  inputsByClass: InputsByClass
  lockEnd?: number
  positionClass?: PositionClass
}) =>
  getAutoRelockComparison({
    amount,
    autoRelock,
    decimals,
    inputsByClass,
    lockDurationInSeconds,
    now,
    positionClass,
    unlockTime: lockEnd,
  })

describe('getAutoRelockComparison', function () {
  it('takes the position out of the class denominator it is already in', function () {
    const { current } = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(weightAtEpochClose),
    })

    // The class weight is this position alone, so nothing dilutes it and the
    // whole baseline is paid. Counting it twice would halve this.
    expect(current.payouts[0].payout).toBe(baseline)
  })

  it('keeps only the other positions in the denominator', function () {
    const { current } = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(weightAtEpochClose * BigInt(2)),
    })

    // Half the class is this position, so it draws exactly half the baseline.
    expect(current.payouts[0].payout).toBe(baseline / BigInt(2))
  })

  it('never lets the remaining class weight go negative', function () {
    const { current } = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(BigInt(1)),
    })

    expect(current.payouts[0].payout).toBe(baseline)
  })

  it('measures the position at the epoch start when auto-relock is on', function () {
    const relocked = compare({
      autoRelock: true,
      inputsByClass: transferableOnly(weightAtEpochStart),
    })
    const notRelocked = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(weightAtEpochStart),
    })

    // Same anchor as the class weight, so the position is the whole class.
    expect(relocked.current.payouts[0].payout).toBe(baseline)
    // The epoch close is one epoch later, where the weight is lower, so a
    // remainder stays in the denominator and dilutes the payout.
    expect(notRelocked.current.payouts[0].payout < baseline).toBe(true)
  })

  it('forecasts the current state and the flipped one', function () {
    const { current, next } = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(BigInt(0)),
    })

    expect(current.payouts[1].weight < current.payouts[0].weight).toBe(true)
    expect(next.payouts[1].weight).toBe(next.payouts[0].weight)
  })

  it('flips which forecast is frozen when auto-relock is already on', function () {
    const { current, next } = compare({
      autoRelock: true,
      inputsByClass: transferableOnly(BigInt(0)),
    })

    expect(current.payouts[1].weight).toBe(current.payouts[0].weight)
    expect(next.payouts[1].weight < next.payouts[0].weight).toBe(true)
  })

  it('stacks the lower forecast as the base and the gap as the delta', function () {
    const { base, current, delta, next } = compare({
      autoRelock: false,
      inputsByClass: transferableOnly(weightAtEpochClose * BigInt(10)),
    })

    expect(base).toHaveLength(current.payouts.length)
    expect(delta).toHaveLength(current.payouts.length)

    base.forEach(function (point, index) {
      const currentAmount = Number(
        formatUnits(current.payouts[index].payout, decimals),
      )
      const nextAmount = Number(
        formatUnits(next.payouts[index].payout, decimals),
      )

      expect(point.y).toBe(Math.min(currentAmount, nextAmount))
      expect(point.y + delta[index].y).toBeCloseTo(
        Math.max(currentAmount, nextAmount),
      )
      expect(delta[index].y >= 0).toBe(true)
    })
  })
  it('takes the position out of its own class, not out of the transferable one', function () {
    const lockedBaseline = BigInt(700) * oneToken
    const inputsByClass = {
      forfeitable: { weight: BigInt(0) },
      locked: { baseline: lockedBaseline, weight: weightAtEpochClose },
      transferable: { baseline, weight: weightAtEpochClose },
    }

    const asLocked = compare({
      autoRelock: false,
      inputsByClass,
      positionClass: {
        forfeitable: false,
        transferableAfter: Number.MAX_SAFE_INTEGER,
      },
    })
    const asTransferable = compare({ autoRelock: false, inputsByClass })

    expect(asLocked.current.payouts[0].payout).toBe(lockedBaseline)
    expect(asTransferable.current.payouts[0].payout).toBe(baseline)
  })

  it('leaves the denominator of the classes it is not in whole', function () {
    const switchesAt = getEpochEnd({ epochsAhead: 3, now })
    const { current } = compare({
      autoRelock: false,
      inputsByClass: {
        forfeitable: { weight: BigInt(0) },
        locked: { baseline, weight: weightAtEpochClose },
        transferable: { baseline, weight: weightAtEpochClose },
      },
      positionClass: { forfeitable: false, transferableAfter: switchesAt },
    })

    expect(current.payouts[3].payout).toBe(
      getEpochPayout({
        baseline,
        classWeight: weightAtEpochClose,
        weight: current.payouts[3].weight,
      }),
    )
  })
  it('only takes the part of an extended lock that sits in its own class', function () {
    const transferableAfter = getEpochEnd({ epochsAhead: 2, now })
    const extendedLockEnd = getEpochEnd({ epochsAhead: 40, now })
    const ownWeight = getWeightAt({
      amount,
      at: getEpochEnd({ epochsAhead: 0, now }),
      lockEnd: transferableAfter,
    })
    const wholeWeight = getWeightAt({
      amount,
      at: getEpochEnd({ epochsAhead: 0, now }),
      lockEnd: extendedLockEnd,
    })

    const { current } = compare({
      autoRelock: false,
      inputsByClass: {
        ...emptyInputsByClass,
        locked: { baseline, weight: wholeWeight },
      },
      lockEnd: extendedLockEnd,
      positionClass: { forfeitable: false, transferableAfter },
    })

    expect(wholeWeight > ownWeight).toBe(true)
    expect(current.payouts[0].payout).toBe(
      getEpochPayout({
        baseline,
        classWeight: wholeWeight - ownWeight,
        weight: current.payouts[0].weight,
      }),
    )
  })
})
