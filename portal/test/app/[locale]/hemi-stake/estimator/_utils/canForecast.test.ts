import { twoYears } from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { canForecast } from 'app/[locale]/hemi-stake/estimator/_utils/canForecast'
import { minLockAmount } from 've-hemi-actions'
import { describe, expect, it } from 'vitest'

const funded = { baseline: BigInt(1), weight: BigInt(0) }
const unfunded = { weight: BigInt(0) }

const inputs = ({
  forfeitable = unfunded,
  locked = unfunded,
  transferable = unfunded,
} = {}) => ({ forfeitable, locked, transferable })

const staked = [{}]

const run = ({
  amountUnits = minLockAmount,
  inputsByClass = inputs({ transferable: funded }),
  lockupDays = twoYears,
  positions = [],
}) => canForecast({ amountUnits, inputsByClass, lockupDays, staked: positions })

describe('canForecast', function () {
  it('should forecast a new position when the transferable pot is funded', function () {
    expect(run({})).toBe(true)
  })

  it('should not forecast when no pot is funded', function () {
    expect(run({ inputsByClass: inputs() })).toBe(false)
  })

  it('should not forecast a new position funded only in another class', function () {
    expect(run({ inputsByClass: inputs({ locked: funded }) })).toBe(false)
  })

  it('should forecast existing positions earning from their own pot', function () {
    expect(
      run({
        amountUnits: BigInt(0),
        inputsByClass: inputs({ locked: funded }),
        positions: staked,
      }),
    ).toBe(true)
  })

  it('should reject an amount below the minimum', function () {
    expect(run({ amountUnits: minLockAmount - BigInt(1) })).toBe(false)
  })

  it('should reject an amount below the minimum even with existing positions', function () {
    expect(
      run({ amountUnits: minLockAmount - BigInt(1), positions: staked }),
    ).toBe(false)
  })

  it('should allow a zero amount when existing positions carry the estimate', function () {
    expect(run({ amountUnits: BigInt(0), positions: staked })).toBe(true)
  })

  it('should reject a zero amount without existing positions', function () {
    expect(run({ amountUnits: BigInt(0) })).toBe(false)
  })

  it('should reject an invalid lockup', function () {
    expect(run({ lockupDays: twoYears + 1 })).toBe(false)
  })
})
