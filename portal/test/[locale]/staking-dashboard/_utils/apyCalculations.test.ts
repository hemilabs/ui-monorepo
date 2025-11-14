import {
  calculateApy,
  calculateDailyRewards,
} from 'app/[locale]/staking-dashboard/_utils/apyCalculations'
import { describe, expect, it } from 'vitest'

describe('calculateDailyRewards', function () {
  it('should calculate daily rewards correctly', function () {
    const result = calculateDailyRewards({
      rewardsPerDay: BigInt('1618075645161000000000'),
      totalSupply: BigInt('11649344692938931129822560'),
      votingPower: BigInt('9245189085900942600'),
    })

    expect(result).toBe(BigInt('1284142214786727'))
  })

  it('should return 0 when total supply is 0', function () {
    const result = calculateDailyRewards({
      rewardsPerDay: BigInt('1000'),
      totalSupply: BigInt('0'),
      votingPower: BigInt('1000'),
    })

    expect(result).toBe(BigInt('0'))
  })

  it('should return 0 when voting power is 0', function () {
    const result = calculateDailyRewards({
      rewardsPerDay: BigInt('1000'),
      totalSupply: BigInt('1000'),
      votingPower: BigInt('0'),
    })

    expect(result).toBe(BigInt('0'))
  })

  it('should handle small voting power correctly', function () {
    const result = calculateDailyRewards({
      rewardsPerDay: BigInt('1000000000000000000'),
      totalSupply: BigInt('1000000'),
      votingPower: BigInt('1'),
    })

    expect(result).toBe(BigInt('1000000000000'))
  })
})

describe('calculateApy', function () {
  it('should calculate APY correctly for normal values', function () {
    const result = calculateApy({
      lockedAmount: BigInt('9674533770000000000'),
      totalDailyRewards: BigInt('1284142214662603'),
    })

    // Expected: ~4.84%
    expect(result).toBeCloseTo(4.84, 1)
  })

  it('should return 0 when total daily rewards is 0', function () {
    const result = calculateApy({
      lockedAmount: BigInt('1000000000000000000'),
      totalDailyRewards: BigInt('0'),
    })

    expect(result).toBe(0)
  })

  it('should return 0 when locked amount is 0', function () {
    const result = calculateApy({
      lockedAmount: BigInt('0'),
      totalDailyRewards: BigInt('1000'),
    })

    expect(result).toBe(0)
  })

  it('should handle very small locked amounts', function () {
    const result = calculateApy({
      lockedAmount: BigInt('1000000000000000'), // 0.001 tokens
      totalDailyRewards: BigInt('63285053088'),
    })

    // Expected: ~2.31%
    expect(result).toBeCloseTo(2.31, 1)
  })

  it('should handle large APY values', function () {
    const result = calculateApy({
      lockedAmount: BigInt('1000000000000000'), // 0.001 tokens
      totalDailyRewards: BigInt('10000000000000000000'), // 10 tokens/day
    })

    // Expected: very high APY
    expect(result).toBeGreaterThan(1000)
  })

  it('should calculate APY correctly for medium locked amount', function () {
    const result = calculateApy({
      lockedAmount: BigInt('110000000000000000'), // 0.11 tokens
      totalDailyRewards: BigInt('14600770108696'),
    })

    // Expected: ~4.84%
    expect(result).toBeCloseTo(4.84, 1)
  })
})
