import {
  maxDays,
  minDays,
  step,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getLockupErrorMessage } from 'app/[locale]/hemi-stake/_utils/lockupError'
import { describe, expect, it } from 'vitest'

describe('getLockupErrorMessage', function () {
  it('has nothing to say about a value on the grid', function () {
    expect(getLockupErrorMessage({ value: minDays + step })).toBeUndefined()
  })

  it('lets the longest lock through even though it is off the grid', function () {
    expect(maxDays % step).not.toBe(0)
    expect(getLockupErrorMessage({ value: maxDays })).toBeUndefined()
  })

  it('asks for a multiple of the step when the value is off the grid', function () {
    expect(getLockupErrorMessage({ value: minDays + 1 })).toEqual({
      key: 'hemi-stake.form.lockup-increment-warning',
      values: {},
    })
  })

  it('names the minimum when the value is below it', function () {
    expect(getLockupErrorMessage({ value: minDays - step })).toEqual({
      key: 'hemi-stake.form.min-days',
      values: { days: minDays },
    })
  })

  it('names the maximum when the value is above it', function () {
    expect(getLockupErrorMessage({ value: maxDays + step })).toEqual({
      key: 'hemi-stake.form.max-days',
      values: { days: maxDays },
    })
  })

  it('names the lock already running rather than the global minimum', function () {
    const minLocked = minDays + 10 * step

    expect(
      getLockupErrorMessage({ minLocked, value: minLocked - step }),
    ).toEqual({ key: 'hemi-stake.form.min-days', values: { days: minLocked } })
  })

  it('treats a value below the running lock as out of range, not off the grid', function () {
    const minLocked = minDays + 10 * step

    expect(
      getLockupErrorMessage({ minLocked, value: minLocked - 1 })?.key,
    ).toBe('hemi-stake.form.min-days')
  })

  it('reads a value it cannot parse as below the minimum', function () {
    expect(getLockupErrorMessage({ value: Number.NaN })?.key).toBe(
      'hemi-stake.form.min-days',
    )
  })
})
