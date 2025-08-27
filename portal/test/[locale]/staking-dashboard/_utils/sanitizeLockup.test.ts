import { sanitizeLockup } from 'app/[locale]/staking-dashboard/_utils/sanitizeLockup'
import { describe, it, expect } from 'vitest'

describe('sanitizeLockup', function () {
  it('returns empty string when input is empty', function () {
    expect(sanitizeLockup({ input: '', value: '123' })).toEqual({ value: '' })
  })

  it('trims leading zeros and whitespace', function () {
    expect(sanitizeLockup({ input: '00012', value: 'x' })).toEqual({
      value: '12',
    })
    expect(sanitizeLockup({ input: '   15   ', value: 'x' })).toEqual({
      value: '15',
    })
  })

  it('falls back to current value when not a number (after cleaning)', function () {
    expect(sanitizeLockup({ input: 'abc', value: '42' })).toEqual({
      value: '42',
    })
    expect(sanitizeLockup({ input: '   ', value: '7' })).toEqual({ value: '7' })
    expect(sanitizeLockup({ input: '000', value: '9' })).toEqual({ value: '9' })
  })

  it('parses like parseFloat (numeric prefix)', function () {
    expect(sanitizeLockup({ input: '12abc', value: 'x' })).toEqual({
      value: '12',
    })

    expect(sanitizeLockup({ input: '.5', value: 'x' })).toEqual({
      value: '0.5',
    })
  })

  it('uses absolute value for negatives (with decimals)', function () {
    expect(sanitizeLockup({ input: '-7', value: 'x' })).toEqual({ value: '7' })
    expect(sanitizeLockup({ input: '-3.2', value: 'x' })).toEqual({
      value: '3.2',
    })
  })

  it('keeps decimals (no flooring/rounding)', function () {
    expect(sanitizeLockup({ input: '7.9', value: 'x' })).toEqual({
      value: '7.9',
    })
    expect(sanitizeLockup({ input: '10.01', value: 'x' })).toEqual({
      value: '10',
    })
  })

  it('allows zero when parsed from a valid numeric input', function () {
    expect(sanitizeLockup({ input: '.0', value: 'x' })).toEqual({ value: '0' })
    expect(sanitizeLockup({ input: '0.4', value: 'x' })).toEqual({
      value: '0.4',
    })
  })

  it('keeps previous value when input becomes invalid after stripping zeros', function () {
    // '0' -> cleaned '' -> NaN -> fallback to previous value
    expect(sanitizeLockup({ input: '0', value: '123' })).toEqual({
      value: '123',
    })
  })

  it('limits to at most 4 digits before parsing', function () {
    expect(sanitizeLockup({ input: '12345', value: 'x' })).toEqual({
      value: '1234',
    })
    expect(sanitizeLockup({ input: '000012345', value: 'x' })).toEqual({
      value: '1234',
    })
    expect(sanitizeLockup({ input: '  987654  ', value: 'x' })).toEqual({
      value: '9876',
    })
    expect(sanitizeLockup({ input: '12345.67', value: 'x' })).toEqual({
      value: '1234',
    })
  })
})
