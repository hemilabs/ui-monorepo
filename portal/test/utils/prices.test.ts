import { TokenWithBalance } from 'types/token'
import { calculateUsdValue } from 'utils/prices'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'

describe('utils/prices', function () {
  describe('calculateUsdValue', function () {
    const mockTokenWithBalance: TokenWithBalance = {
      balance: parseUnits('100', 18), // 100 tokens
      decimals: 18,
      symbol: 'TEST',
    }

    const mockPrices = {
      TEST: '2.50', // $2.50 per token
    }

    it('should calculate USD value correctly for a single token', function () {
      const result = calculateUsdValue([mockTokenWithBalance], mockPrices)
      // 100 * 2.50 = 250
      expect(result).toBe('250')
    })

    it('should calculate USD value correctly for multiple tokens', function () {
      const mockTokenWithBalance2: TokenWithBalance = {
        balance: parseUnits('50', 6), // 50 tokens
        decimals: 6, // USDC-like token
        symbol: 'MUSDC',
      }

      const mockPricesMultiple = {
        MUSDC: '1.00',
        TEST: '2.50',
      }

      const result = calculateUsdValue(
        [mockTokenWithBalance, mockTokenWithBalance2],
        mockPricesMultiple,
      )
      // (100 * 2.50) + (50 * 1.00) = 300
      expect(result).toBe('300')
    })

    it('should handle tokens with different decimal places', function () {
      const mockTokenWithBalanceSmallDecimals: TokenWithBalance = {
        // 2 BTC
        balance: parseUnits('2', 8),
        decimals: 8,
        symbol: 'BTC',
      }

      const mockPricesBTC = {
        BTC: '50000',
      }

      const result = calculateUsdValue(
        [mockTokenWithBalanceSmallDecimals],
        mockPricesBTC,
      )
      // 2 * 50000 = 100000
      expect(result).toBe('100000')
    })

    it('should return 0 for empty token array', function () {
      const result = calculateUsdValue([], mockPrices)
      expect(result).toBe('0')
    })

    it('should handle zero balance', function () {
      const mockTokenZeroBalance: TokenWithBalance = {
        balance: BigInt(0),
        decimals: 18,
        symbol: 'TEST',
      }

      const result = calculateUsdValue([mockTokenZeroBalance], mockPrices)
      expect(result).toBe('0')
    })

    it('should handle missing price (defaults to 0)', function () {
      const mockTokenWithBalanceMissingPrice: TokenWithBalance = {
        balance: parseUnits('100', 18),
        decimals: 18,
        symbol: 'TEST',
      }

      const emptyPrices = {}

      const result = calculateUsdValue(
        [mockTokenWithBalanceMissingPrice],
        emptyPrices,
      )
      expect(result).toBe('0')
    })

    it('should handle token with priceSymbol extension', function () {
      const mockTokenWithBalancePriceSymbol: TokenWithBalance = {
        balance: parseUnits('10', 18),
        decimals: 18,
        extensions: {
          // Maps to TEST price
          priceSymbol: 'TEST',
        },
        symbol: 'WTEST',
      }

      const result = calculateUsdValue(
        [mockTokenWithBalancePriceSymbol],
        mockPrices,
      )
      // 10 * 2.50 = 25 (uses TEST price)
      expect(result).toBe('25')
    })

    it('should handle fractional token amounts correctly', function () {
      const mockTokenWithFractionalBalance: TokenWithBalance = {
        // 0.5 tokens
        balance: parseUnits('0.5', 18),
        decimals: 18,
        symbol: 'TEST',
      }

      const result = calculateUsdValue(
        [mockTokenWithFractionalBalance],
        mockPrices,
      )
      // 0.5 * 2.50 = 1.25
      expect(result).toBe('1.25')
    })
  })
})
