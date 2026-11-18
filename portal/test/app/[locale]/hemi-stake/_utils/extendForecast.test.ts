import {
  getExtendedLockEnd,
  getExtendForecast,
} from 'app/[locale]/hemi-stake/_utils/extendForecast'
import { twoYears } from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getEpochEnd } from 'app/[locale]/hemi-stake/_utils/lockEpochs'
import { alwaysTransferable } from 'app/[locale]/hemi-stake/_utils/rewardClass'
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

const aPosition = {
  amount: hemi(10_000),
  lockEnd: getEpochEnd({ epochsAhead: 20, now }),
  positionClass: alwaysTransferable,
}

const extendTo = (lockupDays: number) => getExtendedLockEnd({ lockupDays, now })

describe('getExtendedLockEnd', function () {
  it('snaps the chosen lockup to an epoch', function () {
    const lockEnd = getExtendedLockEnd({ lockupDays: 100, now })

    expect(lockEnd % SixDaysSeconds).toBe(0)
  })
})

describe('getExtendForecast', function () {
  it('adds nothing when the lockup does not pass the current lock end', function () {
    const { blended, existing, incoming } = getExtendForecast({
      extendedLockEnd: extendTo(30),
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(incoming.yearOneTotal).toBe(BigInt(0))
    expect(blended.yearOneTotal).toBe(existing.yearOneTotal)
    expect(blended.lockEnd).toBe(aPosition.lockEnd)
  })

  it('raises the rate without changing the amount', function () {
    const { blended, existing, totalAmount } = getExtendForecast({
      extendedLockEnd: extendTo(twoYears),
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(totalAmount).toBe(aPosition.amount)
    expect(blended.yearOneReturnRatio).toBeGreaterThan(
      existing.yearOneReturnRatio,
    )
  })

  it('keeps paying the extension after the current lock end', function () {
    const { existing, incoming } = getExtendForecast({
      extendedLockEnd: extendTo(twoYears),
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(existing.payouts[20].payout).toBe(BigInt(0))
    expect(incoming.payouts[20].payout).toBeGreaterThan(BigInt(0))
  })

  it('stops paying at the extended lock end', function () {
    const lockupDays = (30 * SixDaysSeconds) / (24 * 60 * 60)
    const { blended, incoming } = getExtendForecast({
      extendedLockEnd: extendTo(lockupDays),
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(blended.lockEnd).toBe(getEpochEnd({ epochsAhead: 29, now }))
    expect(incoming.payouts[28].payout).toBeGreaterThan(BigInt(0))
    expect(incoming.payouts[29].payout).toBe(BigInt(0))
  })

  it('never adds a negative payout', function () {
    const { incoming } = getExtendForecast({
      extendedLockEnd: extendTo(twoYears),
      inputsByClass,
      now,
      position: aPosition,
    })

    expect(incoming.payouts.every(({ payout }) => payout >= BigInt(0))).toBe(
      true,
    )
  })

  it('pays the extension from the class the position belongs to', function () {
    const position = {
      ...aPosition,
      positionClass: {
        forfeitable: true,
        transferableAfter: getEpochEnd({ epochsAhead: 40, now }),
      },
    }
    const { incoming } = getExtendForecast({
      extendedLockEnd: extendTo(twoYears),
      inputsByClass: {
        ...inputsByClass,
        transferable: { baseline: BigInt(0), weight: transferableWeight },
      },
      now,
      position,
    })

    expect(incoming.payouts[0].payout).toBeGreaterThan(BigInt(0))
  })
})
