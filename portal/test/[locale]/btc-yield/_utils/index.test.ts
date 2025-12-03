import type { Strategy } from 'app/[locale]/btc-yield/_types'
import {
  calculatePoolBufferWeight,
  formatStrategyName,
  formatStrategyWeight,
} from 'app/[locale]/btc-yield/_utils'
import { zeroAddress } from 'viem'
import { describe, it, expect } from 'vitest'

describe('bitcoin-yield utils', function () {
  describe('calculatePoolBufferWeight', function () {
    it('calculates correct pool buffer weight for single strategy', function () {
      const strategies: Strategy[] = [
        {
          address: zeroAddress,
          name: 'Strategy 1',
          weight: BigInt(3000),
        },
      ]

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(7000)) // 10000 - 3000
    })

    it('calculates correct pool buffer weight for multiple strategies', function () {
      const strategies: Strategy[] = [
        {
          address: zeroAddress,
          name: 'Strategy 1',
          weight: BigInt(2000),
        },
        {
          address: zeroAddress,
          name: 'Strategy 2',
          weight: BigInt(3000),
        },
        {
          address: zeroAddress,
          name: 'Strategy 3',
          weight: BigInt(1500),
        },
      ]

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(3500)) // 10000 - (2000 + 3000 + 1500)
    })

    it('returns 10000 for empty strategy array', function () {
      const strategies: Strategy[] = []

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(10000))
    })

    it('returns 0 when total weight equals 10000', function () {
      const strategies: Strategy[] = [
        {
          address: zeroAddress,
          name: 'Strategy 1',
          weight: BigInt(5000),
        },
        {
          address: zeroAddress,
          name: 'Strategy 2',
          weight: BigInt(5000),
        },
      ]

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(0)) // 10000 - 10000
    })

    it('handles strategies with zero weight', function () {
      const strategies: Strategy[] = [
        {
          address: zeroAddress,
          name: 'Strategy 1',
          weight: BigInt(0),
        },
        {
          address: zeroAddress,
          name: 'Strategy 2',
          weight: BigInt(4000),
        },
      ]

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(6000)) // 10000 - (0 + 4000)
    })

    it('handles large weight values', function () {
      const strategies: Strategy[] = [
        {
          address: zeroAddress,
          name: 'Strategy 1',
          weight: BigInt(9999),
        },
      ]

      const result = calculatePoolBufferWeight(strategies)
      expect(result).toBe(BigInt(1)) // 10000 - 9999
    })
  })

  // Ideally, as more strategies are listed in Hemi, we should add them here.
  describe('formatStrategyName', function () {
    it('should format Morpho strategy name correctly', function () {
      const result = formatStrategyName(
        'Morpho_ClearstarReactor_hemiBTC',
        'hemiBTC',
      )
      expect(result).toBe('Morpho Clearstar Reactor')
    })

    it('should handle empty strategy name', function () {
      const result = formatStrategyName('', 'BTC')
      expect(result).toBe('')
    })
  })

  describe('formatStrategyWeight', function () {
    it('should format strategy weight of 5000 (50%) correctly', function () {
      const result = formatStrategyWeight(BigInt(5000))
      expect(result).toBe('50.00%')
    })

    it('should format strategy weight of 0 (0%) correctly', function () {
      const result = formatStrategyWeight(BigInt(0))
      expect(result).toBe('0.00%')
    })

    it('should format strategy weight of 10000 (100%) correctly', function () {
      const result = formatStrategyWeight(BigInt(10000))
      expect(result).toBe('100.00%')
    })

    it('should format strategy weight of 1 (0.01%) correctly', function () {
      const result = formatStrategyWeight(BigInt(1))
      expect(result).toBe('0.01%')
    })

    it('should format strategy weight of 9999 (99.99%) correctly', function () {
      const result = formatStrategyWeight(BigInt(9999))
      expect(result).toBe('99.99%')
    })
  })
})
