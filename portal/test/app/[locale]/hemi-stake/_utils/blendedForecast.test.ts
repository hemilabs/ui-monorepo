import {
  getBlendedForecast,
  getClassWeights,
} from 'app/[locale]/hemi-stake/_utils/blendedForecast'
import {
  getEpochEnd,
  getWeightAt,
} from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { alwaysTransferable } from 'app/[locale]/hemi-stake/_utils/rewardClass'
import { getRewardsForecast } from 'app/[locale]/hemi-stake/_utils/stakeRewardsForecast'
import { MinLockDurationSeconds, SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const now = SixDaysSeconds * 3000
const oneYear = 366 * 24 * 60 * 60
const hemi = (units: number) => BigInt(units) * BigInt(10) ** BigInt(18)

const transferableBaseline = hemi(4_166_666)
const transferableWeight = hemi(21_081_403)
const ownBaseline = hemi(65_000)
const ownWeight = hemi(74_996_647)

const inputsByClass = {
  forfeitable: { baseline: ownBaseline, weight: ownWeight },
  locked: { baseline: ownBaseline, weight: ownWeight },
  transferable: {
    baseline: transferableBaseline,
    weight: transferableWeight,
  },
}

const anExistingPosition = {
  amount: hemi(20_000),
  lockEnd: now + 2 * oneYear,
  positionClass: alwaysTransferable,
}

const anIncomingPosition = {
  amount: hemi(10_000),
  lockDurationInSeconds: 2 * oneYear,
}

const noIncoming = { amount: BigInt(0), lockDurationInSeconds: oneYear }

describe('getClassWeights', function () {
  const amount = hemi(125_000)
  const transferableAfter = now + oneYear
  const lockEnd = transferableAfter + oneYear

  it('puts the whole weight in the transferable pot once the instant passes', function () {
    const at = transferableAfter
    expect(
      getClassWeights({
        amount,
        at,
        lockEnd,
        positionClass: { forfeitable: true, transferableAfter },
      }),
    ).toEqual({ transferable: getWeightAt({ amount, at, lockEnd }) })
  })

  it('splits the weight between the own class and the transferable residual', function () {
    const at = now
    const own = getWeightAt({ amount, at, lockEnd: transferableAfter })

    expect(
      getClassWeights({
        amount,
        at,
        lockEnd,
        positionClass: { forfeitable: true, transferableAfter },
      }),
    ).toEqual({
      forfeitable: own,
      transferable: getWeightAt({ amount, at, lockEnd }) - own,
    })
  })

  it('leaves no residual when the lock ends at the transferable instant', function () {
    const at = now
    expect(
      getClassWeights({
        amount,
        at,
        lockEnd: transferableAfter,
        positionClass: { forfeitable: true, transferableAfter },
      }),
    ).toEqual({
      forfeitable: getWeightAt({ amount, at, lockEnd: transferableAfter }),
      transferable: BigInt(0),
    })
  })

  it('uses the locked pot for a position that is not forfeitable', function () {
    const at = now
    const weights = getClassWeights({
      amount,
      at,
      lockEnd,
      positionClass: { forfeitable: false, transferableAfter },
    })

    expect(weights.locked).toBe(
      getWeightAt({ amount, at, lockEnd: transferableAfter }),
    )
    expect(weights.forfeitable).toBeUndefined()
  })
})

describe('getBlendedForecast', function () {
  it('leaves an existing position out of its own denominator', function () {
    const { existing } = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: noIncoming,
      inputsByClass,
      now,
    })

    const at = getEpochEnd({ epochsAhead: 0, now })
    const weight = getWeightAt({
      amount: anExistingPosition.amount,
      at,
      lockEnd: anExistingPosition.lockEnd,
    })

    expect(existing.payouts[0].payout).toBe(
      (transferableBaseline * weight) / transferableWeight,
    )
  })

  it('matches the single position forecast when nothing is staked yet', function () {
    const { blended, incoming } = getBlendedForecast({
      existing: [],
      incoming: anIncomingPosition,
      inputsByClass,
      now,
    })
    const alone = getRewardsForecast({
      amount: anIncomingPosition.amount,
      inputsByClass,
      lockDurationInSeconds: anIncomingPosition.lockDurationInSeconds,
      now,
    })

    expect(incoming.yearOneTotal).toBe(alone.yearOneTotal)
    expect(blended.yearOneTotal).toBe(alone.yearOneTotal)
    expect(blended.yearOneReturnRatio).toBe(alone.yearOneReturnRatio)
  })

  it('still pays a position that has not reached the transferable class', function () {
    const transferableAfter = getEpochEnd({ epochsAhead: 40, now })
    const { existing } = getBlendedForecast({
      existing: [
        {
          ...anExistingPosition,
          positionClass: { forfeitable: true, transferableAfter },
        },
      ],
      incoming: noIncoming,
      inputsByClass: {
        ...inputsByClass,
        forfeitable: { baseline: BigInt(0), weight: ownWeight },
      },
      now,
    })

    expect(existing.payouts[0].payout).toBeGreaterThan(BigInt(0))
  })

  it('measures the own class weight against the transferable instant', function () {
    const transferableAfter = getEpochEnd({ epochsAhead: 40, now })
    const position = {
      ...anExistingPosition,
      positionClass: { forfeitable: true, transferableAfter },
    }
    const { existing } = getBlendedForecast({
      existing: [position],
      incoming: noIncoming,
      inputsByClass: {
        ...inputsByClass,
        transferable: { baseline: BigInt(0), weight: transferableWeight },
      },
      now,
    })

    const at = getEpochEnd({ epochsAhead: 0, now })
    const againstTransferableAfter = getWeightAt({
      amount: position.amount,
      at,
      lockEnd: transferableAfter,
    })
    const againstLockEnd = getWeightAt({
      amount: position.amount,
      at,
      lockEnd: position.lockEnd,
    })

    expect(existing.payouts[0].payout).toBe(
      (ownBaseline * againstTransferableAfter) / ownWeight,
    )
    expect(againstTransferableAfter).toBeLessThan(againstLockEnd)
  })

  it('joins the transferable denominator once a position moves there', function () {
    const transferableAfter = getEpochEnd({ epochsAhead: 30, now })
    const mover = {
      ...anExistingPosition,
      positionClass: { forfeitable: true, transferableAfter },
    }
    const { existing } = getBlendedForecast({
      existing: [mover],
      incoming: noIncoming,
      inputsByClass,
      now,
    })

    const settled = getEpochEnd({ epochsAhead: 0, now })
    const alreadyCounted =
      getWeightAt({
        amount: mover.amount,
        at: settled,
        lockEnd: mover.lockEnd,
      }) -
      getWeightAt({
        amount: mover.amount,
        at: settled,
        lockEnd: transferableAfter,
      })

    // The residual is flat before the move, so the denominator only shifts
    // once the whole weight is transferable and starts decaying.
    const at = getEpochEnd({ epochsAhead: 45, now })
    const weight = getWeightAt({
      amount: mover.amount,
      at,
      lockEnd: mover.lockEnd,
    })

    expect(weight).not.toBe(alreadyCounted)
    expect(existing.payouts[45].payout).toBe(
      (transferableBaseline * weight) /
        (transferableWeight + weight - alreadyCounted),
    )
  })

  it('adds the two legs into the blended total', function () {
    const { blended, existing, incoming } = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: anIncomingPosition,
      inputsByClass,
      now,
    })

    expect(blended.yearOneTotal).toBe(
      existing.yearOneTotal + incoming.yearOneTotal,
    )
    expect(blended.payouts[0].payout).toBe(
      existing.payouts[0].payout + incoming.payouts[0].payout,
    )
  })

  it('lands the blended rate between the two legs', function () {
    const { blended, existing, incoming } = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: anIncomingPosition,
      inputsByClass,
      now,
    })

    expect(blended.yearOneReturnRatio).toBeGreaterThanOrEqual(
      Math.min(existing.yearOneReturnRatio, incoming.yearOneReturnRatio),
    )
    expect(blended.yearOneReturnRatio).toBeLessThanOrEqual(
      Math.max(existing.yearOneReturnRatio, incoming.yearOneReturnRatio),
    )
  })

  it('keeps an expired position out of the rate', function () {
    const expired = {
      ...anExistingPosition,
      lockEnd: getEpochEnd({ epochsAhead: 0, now }) - SixDaysSeconds,
    }
    const alone = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: anIncomingPosition,
      inputsByClass,
      now,
    })
    const withExpired = getBlendedForecast({
      existing: [anExistingPosition, expired],
      incoming: anIncomingPosition,
      inputsByClass,
      now,
    })

    expect(withExpired.existing.yearOneReturnRatio).toBe(
      alone.existing.yearOneReturnRatio,
    )
  })

  it('stops paying a position once its lock ends', function () {
    const lockEnd = getEpochEnd({ epochsAhead: 5, now })
    const { existing } = getBlendedForecast({
      existing: [{ ...anExistingPosition, lockEnd }],
      incoming: noIncoming,
      inputsByClass,
      now,
    })

    expect(existing.payouts[4].payout).toBeGreaterThan(BigInt(0))
    expect(existing.payouts[5].payout).toBe(BigInt(0))
  })

  it('holds an incoming lock to the contract minimum', function () {
    const { incoming } = getBlendedForecast({
      existing: [],
      incoming: { amount: hemi(10_000), lockDurationInSeconds: 12 * 86400 },
      inputsByClass,
      now,
    })
    const atTheMinimum = getBlendedForecast({
      existing: [],
      incoming: {
        amount: hemi(10_000),
        lockDurationInSeconds: MinLockDurationSeconds,
      },
      inputsByClass,
      now,
    })

    expect(incoming.yearOneTotal).toBeGreaterThan(BigInt(0))
    expect(incoming.yearOneTotal).toBe(atTheMinimum.incoming.yearOneTotal)
  })

  it('dilutes what is already staked when a position joins', function () {
    const withoutIncoming = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: { amount: BigInt(0), lockDurationInSeconds: 2 * oneYear },
      inputsByClass,
      now,
    })
    const withIncoming = getBlendedForecast({
      existing: [anExistingPosition],
      incoming: { ...anIncomingPosition, amount: hemi(5_000_000) },
      inputsByClass,
      now,
    })

    expect(withIncoming.existing.yearOneTotal).toBeLessThan(
      withoutIncoming.existing.yearOneTotal,
    )
  })
})
