import { calculateSplitAmount } from 'app/[locale]/claim/_utils'
import { describe, expect, it } from 'vitest'

// 1 token with 18 decimals
const amount = BigInt(1000000000000000000)

describe('claim/_utils', function () {
  describe('calculateSplitAmount', function () {
    it('should calculate correct split amounts with 0% bonus and 50% lockup ratio', function () {
      const result = calculateSplitAmount({
        amount,
        bonusPercentage: 0,
        lockupRatio: 50,
      })

      expect(result).toEqual({
        staked: amount / BigInt(2), // 0.5 tokens
        unlocked: amount / BigInt(2), // 0.5 tokens
      })
    })

    it('should calculate correct split amounts with 10% bonus and 75% lockup ratio', function () {
      const result = calculateSplitAmount({
        amount,
        bonusPercentage: 10,
        lockupRatio: 75,
      })

      // 75% staked = 0.75 tokens + 10% bonus = 0.825 tokens
      // 25% unlocked = 0.25 tokens + 10% bonus = 0.275 tokens
      expect(result).toEqual({
        staked: BigInt(825000000000000000), // 0.825 tokens
        unlocked: BigInt(275000000000000000), // 0.275 tokens
      })
    })

    it('should calculate correct split amounts with 25% bonus and 100% lockup ratio', function () {
      const result = calculateSplitAmount({
        amount: amount * BigInt(2),
        bonusPercentage: 25,
        lockupRatio: 100,
      })

      // 100% staked = 2 tokens + 25% bonus = 2.5 tokens
      // 0% unlocked = 0 tokens + 25% bonus = 0 tokens
      expect(result).toEqual({
        staked: BigInt(2500000000000000000), // 2.5 tokens
        unlocked: BigInt(0), // 0 tokens
      })
    })

    it('should calculate correct split amounts with 0% bonus and 0% lockup ratio', function () {
      const result = calculateSplitAmount({
        amount: BigInt(500000000000000000), // 0.5 tokens (18 decimals)
        bonusPercentage: 0,
        lockupRatio: 0,
      })

      // 0% staked = 0 tokens + 0% bonus = 0 tokens
      // 100% unlocked = 0.5 tokens + 0% bonus = 0.5 tokens
      expect(result).toEqual({
        staked: BigInt(0), // 0 tokens
        unlocked: BigInt(500000000000000000), // 0.5 tokens
      })
    })

    it('should handle decimal percentages correctly', function () {
      const result = calculateSplitAmount({
        amount,
        bonusPercentage: 7.5,
        lockupRatio: 33.3,
      })

      // 33.3% staked = 0.333 tokens + 7.5% bonus ≈ 0.35798 tokens
      // 66.7% unlocked = 0.667 tokens + 7.5% bonus ≈ 0.71703 tokens
      expect(result.staked).toBe(BigInt(357975000000000000)) // ~0.358 tokens
      expect(result.unlocked).toBe(BigInt(717025000000000000)) // ~0.717 tokens
    })

    it('should handle very small amounts correctly', function () {
      const result = calculateSplitAmount({
        amount: BigInt(1000),
        bonusPercentage: 5,
        lockupRatio: 60,
      })

      // 60% staked = 600 + 5% bonus = 630
      // 40% unlocked = 400 + 5% bonus = 420
      expect(result).toEqual({
        staked: BigInt(630),
        unlocked: BigInt(420),
      })
    })

    it('should handle large amounts correctly', function () {
      const result = calculateSplitAmount({
        amount: BigInt('1000000000000000000000000'),
        bonusPercentage: 15,
        lockupRatio: 80,
      })

      // 80% staked = 800k tokens + 15% bonus = 920k tokens
      // 20% unlocked = 200k tokens + 15% bonus = 230k tokens
      expect(result).toEqual({
        staked: BigInt('920000000000000000000000'), // 920k tokens
        unlocked: BigInt('230000000000000000000000'), // 230k tokens
      })
    })

    it('should handle zero amount', function () {
      const result = calculateSplitAmount({
        amount: BigInt(0),
        bonusPercentage: 20,
        lockupRatio: 50,
      })

      expect(result).toEqual({
        staked: BigInt(0),
        unlocked: BigInt(0),
      })
    })

    it('should verify total amount after bonus application', function () {
      const originalAmount = amount

      const result = calculateSplitAmount({
        amount: originalAmount,
        bonusPercentage: 20,
        lockupRatio: 40,
      })

      // Total after bonus should be original amount + 20% bonus
      const expectedTotal =
        originalAmount + (originalAmount * BigInt(20)) / BigInt(100)
      const actualTotal = result.staked + result.unlocked

      expect(actualTotal).toBe(expectedTotal)
      expect(actualTotal).toBe(BigInt(1200000000000000000)) // 1.2 tokens
    })
  })
})
