import { sanitizeAmount } from 'utils/form'
import { describe, expect, it } from 'vitest'

describe('sanitizeAmount', function () {
  it('should return "0" if input is empty', function () {
    const result = sanitizeAmount('')
    expect(result).toEqual({ value: '0' })
  })

  it('should return error if input is not a valid number', function () {
    const result = sanitizeAmount('abc')
    expect(result).toHaveProperty('error')
  })

  it('should remove leading zeroes from input', function () {
    const result = sanitizeAmount('0123')
    expect(result).toEqual({ value: '123' })
  })

  it('should add a zero if input starts with a dot', function () {
    const result = sanitizeAmount('.5')
    expect(result).toEqual({ value: '0.5' })
  })

  it('should return the same value if input is a valid number', function () {
    const result = sanitizeAmount('123.45')
    expect(result).toEqual({ value: '123.45' })
  })

  it('should return error if input is a negative number', function () {
    const result = sanitizeAmount('-123')
    expect(result).toHaveProperty('error')
  })

  it('should return zero if input is "0"', function () {
    const result = sanitizeAmount('0')
    expect(result).toEqual({ value: '0' })
  })

  it('should return zero if input is "00"', function () {
    const result = sanitizeAmount('00')
    expect(result).toEqual({ value: '0' })
  })

  it('should return 0.123 if input is "00.123"', function () {
    const result = sanitizeAmount('00.123')
    expect(result).toEqual({ value: '0.123' })
  })

  it('should return 0.123 if input is "0.123 " (Trailing spaces)', function () {
    const result = sanitizeAmount('0.123   ')
    expect(result).toEqual({ value: '0.123' })
  })

  it('should return 0.123 if input is " 0.123 " (Leading spaces)', function () {
    const result = sanitizeAmount('    0.123')
    expect(result).toEqual({ value: '0.123' })
  })
})
