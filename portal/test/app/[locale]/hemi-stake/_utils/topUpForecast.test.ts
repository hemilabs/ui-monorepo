import { getBlendedForecast } from 'app/[locale]/hemi-stake/_utils/blendedForecast'
import { getEpochEnd } from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { alwaysTransferable } from 'app/[locale]/hemi-stake/_utils/rewardClass'
import {
  earnsAnotherEpoch,
  getTopUpForecast,
} from 'app/[locale]/hemi-stake/_utils/topUpForecast'
import { SixDaysSeconds } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const now = SixDaysSeconds * 3000
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

const lockEnd = getEpochEnd({ epochsAhead: 20, now })
const addedAmount = hemi(10_000)

const aPosition = {
  amount: hemi(20_000),
  lockEnd,
  positionClass: alwaysTransferable,
}

describe('earnsAnotherEpoch', function () {
  it('is false for a lock that ends before the next settlement', function () {
    const settledAt = getEpochEnd({ epochsAhead: 0, now })

    expect(earnsAnotherEpoch({ lockEnd: settledAt, now })).toBe(false)
    expect(
      earnsAnotherEpoch({ lockEnd: settledAt - SixDaysSeconds, now }),
    ).toBe(false)
    expect(
      earnsAnotherEpoch({ lockEnd: settledAt + SixDaysSeconds, now }),
    ).toBe(true)
  })

  it('snaps the lock end before comparing', function () {
    const settledAt = getEpochEnd({ epochsAhead: 0, now })

    expect(
      earnsAnotherEpoch({ lockEnd: settledAt + SixDaysSeconds / 2, now }),
    ).toBe(false)
  })
})

describe('getTopUpForecast', function () {
  it('stops paying the added amount at the lock it inherits', function () {
    const { incoming } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(incoming.payouts[19].payout).toBeGreaterThan(BigInt(0))
    expect(incoming.payouts[20].payout).toBe(BigInt(0))
  })

  it('weighs the added amount in the class the position carries', function () {
    const transferableAfter = getEpochEnd({ epochsAhead: 40, now })
    const { incoming } = getTopUpForecast({
      addedAmount,
      inputsByClass: {
        ...inputsByClass,
        transferable: { baseline: BigInt(0), weight: transferableWeight },
      },
      now,
      position: {
        ...aPosition,
        positionClass: { forfeitable: true, transferableAfter },
      },
    })

    expect(incoming.yearOneTotal).toBeGreaterThan(BigInt(0))
  })

  it('dilutes the position it joins', function () {
    const { blended } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })
    const positionAlone = getTopUpForecast({
      addedAmount: BigInt(0),
      inputsByClass,
      now,
      position: aPosition,
    })
    const addedAlone = getBlendedForecast({
      existing: [],
      incoming: {
        amount: addedAmount,
        lockDurationInSeconds: lockEnd - now,
        positionClass: aPosition.positionClass,
      },
      inputsByClass,
      now,
    })

    expect(blended.yearOneTotal).toBeLessThan(
      positionAlone.existing.yearOneTotal + addedAlone.incoming.yearOneTotal,
    )
  })

  it('barely moves the rate', function () {
    const { blended } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })
    const positionAlone = getTopUpForecast({
      addedAmount: BigInt(0),
      inputsByClass,
      now,
      position: aPosition,
    })
    const alone = positionAlone.existing.yearOneReturnRatio

    expect(blended.yearOneReturnRatio).toBeLessThan(alone)
    expect((alone - blended.yearOneReturnRatio) / alone).toBeLessThan(0.01)
  })

  it('settles the next payout from both legs', function () {
    const forecast = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(forecast.nextPayout).toBe(
      forecast.existing.payouts[0].payout + forecast.incoming.payouts[0].payout,
    )
    expect(forecast.nextPayout).toBeGreaterThan(
      forecast.existing.payouts[0].payout,
    )
  })

  it('reports the amount staked once the top up settles', function () {
    const { totalAmount } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(totalAmount).toBe(aPosition.amount + addedAmount)
  })

  it('counts the days left on the lock, not the days it ran', function () {
    const { daysUntilUnlock } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(daysUntilUnlock).toBe(Math.round((lockEnd - now) / (24 * 60 * 60)))
  })

  it('reports no payout when the class the position earns in is empty', function () {
    const transferableOnly = {
      ...inputsByClass,
      forfeitable: { weight: ownWeight },
      locked: { weight: ownWeight },
    }
    const neverTransferable = {
      ...aPosition,
      lockEnd,
      positionClass: { forfeitable: true, transferableAfter: lockEnd },
    }

    expect(
      getTopUpForecast({
        addedAmount,
        inputsByClass: transferableOnly,
        now,
        position: neverTransferable,
      }).paysInFirstYear,
    ).toBe(false)
    expect(
      getTopUpForecast({ addedAmount, inputsByClass, now, position: aPosition })
        .paysInFirstYear,
    ).toBe(true)
  })

  it('snaps a raw unlock time so both legs share the lock', function () {
    const lastPaid = (payouts: { payout: bigint }[]) =>
      payouts.findLastIndex(({ payout }) => payout > BigInt(0))

    const { existing, incoming } = getTopUpForecast({
      addedAmount,
      inputsByClass,
      now,
      position: { ...aPosition, lockEnd: lockEnd + SixDaysSeconds / 2 },
    })

    expect(lastPaid(incoming.payouts)).toBe(lastPaid(existing.payouts))
  })
})
