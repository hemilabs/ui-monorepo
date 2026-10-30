import { isBelowMinimumStake } from 'app/[locale]/hemi-stake/_utils/minimumStake'
import { minLockAmount } from 've-hemi-actions'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'

describe('isBelowMinimumStake', function () {
  it('puts the floor at 10 HEMI', function () {
    expect(isBelowMinimumStake(parseUnits('9.999999999999999999', 18))).toBe(
      true,
    )
    expect(isBelowMinimumStake(parseUnits('10', 18))).toBe(false)
  })

  it('says nothing about an empty amount', function () {
    expect(isBelowMinimumStake(BigInt(0))).toBe(false)
  })

  it('flags the smallest amount above zero', function () {
    expect(isBelowMinimumStake(BigInt(1))).toBe(true)
  })

  it('flags an amount one unit short of the minimum', function () {
    expect(isBelowMinimumStake(minLockAmount - BigInt(1))).toBe(true)
  })

  it('lets the minimum itself through', function () {
    expect(isBelowMinimumStake(minLockAmount)).toBe(false)
  })

  it('lets an amount above the minimum through', function () {
    expect(isBelowMinimumStake(minLockAmount * BigInt(2))).toBe(false)
  })
})
