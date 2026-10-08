import { minBigInt } from 'utils/bigint'
import { describe, expect, it } from 'vitest'

describe('minBigInt', function () {
  it('returns the smallest value', function () {
    expect(minBigInt(BigInt(3), BigInt(1), BigInt(2))).toBe(BigInt(1))
  })

  it('returns the value when only one is given', function () {
    expect(minBigInt(BigInt(5))).toBe(BigInt(5))
  })
})
