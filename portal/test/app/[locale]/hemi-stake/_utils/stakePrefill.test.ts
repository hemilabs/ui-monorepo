import {
  maxDays,
  minDays,
  step,
  twoYears,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { parseStakePrefill } from 'app/[locale]/hemi-stake/_utils/stakePrefill'
import { describe, expect, it } from 'vitest'

describe('parseStakePrefill', function () {
  it('carries an amount and a lockup the form can take', function () {
    expect(
      parseStakePrefill({ amount: '10000', lockupDays: twoYears }),
    ).toEqual({
      input: '10000',
      inputDays: String(twoYears),
      lockupDays: twoYears,
    })
  })

  it('fills nothing when the url carries nothing', function () {
    expect(parseStakePrefill({ amount: null, lockupDays: null })).toEqual({})
  })

  it('keeps the lockup when the amount is not a number', function () {
    expect(parseStakePrefill({ amount: 'abc', lockupDays: twoYears })).toEqual({
      inputDays: String(twoYears),
      lockupDays: twoYears,
    })
  })

  it('keeps the amount when the lockup is off the six day grid', function () {
    expect(
      parseStakePrefill({ amount: '10000', lockupDays: minDays + 1 }),
    ).toEqual({ input: '10000' })
  })

  it('drops a lockup below the minimum', function () {
    expect(
      parseStakePrefill({ amount: null, lockupDays: minDays - step }),
    ).toEqual({})
  })

  it('drops a lockup above the maximum', function () {
    expect(
      parseStakePrefill({ amount: null, lockupDays: maxDays + step }),
    ).toEqual({})
  })

  it('takes the longest lock even though it is off the grid', function () {
    expect(parseStakePrefill({ amount: null, lockupDays: maxDays })).toEqual({
      inputDays: String(maxDays),
      lockupDays: maxDays,
    })
  })

  it('leaves the form at its own default rather than prefilling zero', function () {
    // sanitizeAmount returns these verbatim, so comparing against '0' misses them
    const zeroes = ['0', '', '0.0', '0.00', '.0', '0.']
    zeroes.forEach(function (amount) {
      expect(parseStakePrefill({ amount, lockupDays: null })).toEqual({})
    })
  })

  it('normalizes an amount the way the input would', function () {
    expect(parseStakePrefill({ amount: '0100.50', lockupDays: null })).toEqual({
      input: '100.50',
    })
  })

  it('refuses a negative amount', function () {
    expect(parseStakePrefill({ amount: '-5', lockupDays: null })).toEqual({})
  })
})
