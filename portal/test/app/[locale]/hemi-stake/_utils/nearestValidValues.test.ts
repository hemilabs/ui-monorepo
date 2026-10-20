import {
  maxDays,
  minDays,
  step,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getNearestValidValues } from 'app/[locale]/hemi-stake/_utils/nearestValidValues'
import { describe, expect, it } from 'vitest'

describe('hemi-stake/_utils/nearestValidValues', function () {
  it('should give up on a value that is not a number', function () {
    expect(getNearestValidValues({ value: Number.NaN })).toBeNull()
  })

  it('should only suggest going down once the max is reached', function () {
    expect(getNearestValidValues({ value: maxDays })).toEqual({
      maxValue: maxDays,
      minValue: null,
    })
    expect(getNearestValidValues({ value: maxDays + step })).toEqual({
      maxValue: maxDays,
      minValue: null,
    })
  })

  it('should only suggest going up once the min is reached', function () {
    expect(getNearestValidValues({ value: minDays })).toEqual({
      maxValue: null,
      minValue: minDays,
    })
    expect(getNearestValidValues({ value: 0 })).toEqual({
      maxValue: null,
      minValue: minDays,
    })
  })

  it('should surround the value with the steps it sits between', function () {
    expect(getNearestValidValues({ value: minDays + step + 2 })).toEqual({
      maxValue: minDays + step * 2,
      minValue: minDays + step,
    })
  })

  it('should land on the value itself when it already is a step', function () {
    const onAStep = minDays + step * 3
    expect(getNearestValidValues({ value: onAStep })).toEqual({
      maxValue: onAStep + step,
      minValue: onAStep,
    })
  })

  it('should drop a suggestion that falls below the locked minimum', function () {
    const minLocked = minDays + step * 2 + 2
    expect(getNearestValidValues({ minLocked, value: minLocked + 2 })).toEqual({
      maxValue: minDays + step * 3,
      minValue: null,
    })
  })

  it('should point at the locked minimum when the value is under it', function () {
    const minLocked = minDays + step * 4
    expect(getNearestValidValues({ minLocked, value: minDays + step })).toEqual(
      { maxValue: null, minValue: minLocked },
    )
  })
})
