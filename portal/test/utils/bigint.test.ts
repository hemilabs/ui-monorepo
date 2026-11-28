import { minBigInt, toFraction } from 'utils/bigint'
import { describe, expect, it } from 'vitest'

describe('minBigInt', function () {
  it('returns the smallest value', function () {
    expect(minBigInt(BigInt(3), BigInt(1), BigInt(2))).toBe(BigInt(1))
  })

  it('returns the value when only one is given', function () {
    expect(minBigInt(BigInt(5))).toBe(BigInt(5))
  })
})

describe('toFraction', function () {
  it('divides the two values', function () {
    expect(toFraction(BigInt(1), BigInt(4))).toBe(0.25)
  })

  it('returns zero instead of dividing by zero', function () {
    expect(toFraction(BigInt(5), BigInt(0))).toBe(0)
  })
})
