import {
  maxDays,
  minDays,
  step,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getLockupErrorMessage } from 'app/[locale]/hemi-stake/_utils/lockupError'
import { getNearestValidValues } from 'app/[locale]/hemi-stake/_utils/nearestValidValues'
import { describe, expect, it } from 'vitest'

const lockMinimum = minDays + 48 * step
const highestStep = maxDays - ((maxDays - minDays) % step)

describe('getNearestValidValues', function () {
  it('has no suggestion for a value that is not a number', function () {
    expect(getNearestValidValues({ value: NaN })).toBeNull()
  })

  it('suggests the maximum for a value at or above it', function () {
    expect(getNearestValidValues({ value: maxDays })).toEqual({
      maxValue: maxDays,
      minValue: null,
    })
    expect(getNearestValidValues({ value: maxDays + 1 })).toEqual({
      maxValue: maxDays,
      minValue: null,
    })
  })

  it('suggests the global floor when there is no lock minimum', function () {
    expect(getNearestValidValues({ value: minDays - 1 })).toEqual({
      maxValue: null,
      minValue: minDays,
    })
  })

  it('brackets a value that falls between two steps', function () {
    expect(getNearestValidValues({ value: minDays + step + 1 })).toEqual({
      maxValue: minDays + step * 2,
      minValue: minDays + step,
    })
  })

  it('brackets a value that already sits on a step', function () {
    const onAStep = minDays + step * 3
    expect(getNearestValidValues({ value: onAStep })).toEqual({
      maxValue: onAStep + step,
      minValue: onAStep,
    })
  })

  it('suggests the lock minimum for a value below the global floor', function () {
    expect(
      getNearestValidValues({ minLocked: lockMinimum, value: minDays - 1 }),
    ).toEqual({ maxValue: null, minValue: lockMinimum })
  })

  it('suggests the lock minimum for a value of zero', function () {
    expect(getNearestValidValues({ minLocked: lockMinimum, value: 0 })).toEqual(
      { maxValue: null, minValue: lockMinimum },
    )
  })

  it('suggests the lock minimum for a fractional value below the global floor', function () {
    expect(
      getNearestValidValues({ minLocked: lockMinimum, value: minDays - 0.1 }),
    ).toEqual({ maxValue: null, minValue: lockMinimum })
  })

  it('suggests the lock minimum for a value sitting on the global floor', function () {
    expect(
      getNearestValidValues({ minLocked: lockMinimum, value: minDays }),
    ).toEqual({ maxValue: null, minValue: lockMinimum })
  })

  it('suggests the lock minimum for a value between the floor and the minimum', function () {
    expect(
      getNearestValidValues({ minLocked: lockMinimum, value: lockMinimum - 1 }),
    ).toEqual({ maxValue: null, minValue: lockMinimum })
  })

  it('keeps the global floor when the lock minimum is the global floor', function () {
    expect(
      getNearestValidValues({ minLocked: minDays, value: minDays - 1 }),
    ).toEqual({ maxValue: null, minValue: minDays })
  })

  it('brackets a value above the lock minimum', function () {
    expect(
      getNearestValidValues({ minLocked: lockMinimum, value: lockMinimum + 1 }),
    ).toEqual({ maxValue: lockMinimum + step, minValue: lockMinimum })
  })

  it('drops the lower bound when it falls below an off-grid lock minimum', function () {
    expect(
      getNearestValidValues({
        minLocked: lockMinimum + 1,
        value: lockMinimum + 2,
      }),
    ).toEqual({ maxValue: lockMinimum + step, minValue: null })
  })

  it('suggests the maximum when the lock minimum is the maximum', function () {
    expect(
      getNearestValidValues({ minLocked: maxDays, value: lockMinimum }),
    ).toEqual({ maxValue: null, minValue: maxDays })
  })

  it('never suggests a value the lockup validator rejects', function () {
    const lockMinimums = [
      undefined,
      minDays,
      minDays + step,
      lockMinimum,
      highestStep,
      maxDays,
    ]
    const values = [
      0,
      0.5,
      minDays - 1,
      minDays,
      minDays + 1,
      minDays + step,
      lockMinimum - 1,
      lockMinimum,
      lockMinimum + 1,
      maxDays - step,
      maxDays - 1,
      maxDays,
      maxDays + 1,
    ]

    lockMinimums.forEach(function (minLocked) {
      values.forEach(function (value) {
        const nearest = getNearestValidValues({ minLocked, value })
        const suggestions = [nearest?.minValue, nearest?.maxValue].filter(
          suggestion => typeof suggestion === 'number',
        )

        suggestions.forEach(function (suggestion) {
          expect(
            getLockupErrorMessage({ minLocked, value: suggestion }),
            `minLocked=${minLocked} value=${value} suggested ${suggestion}`,
          ).toBeUndefined()
        })
      })
    })
  })
})
