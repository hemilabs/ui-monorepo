import {
  getTokenPrice,
  isStakeToken,
  isTunnelToken,
  isEvmToken,
  tunnelsThroughPartners,
  parseTokenUnits,
  getTokenSymbol,
  getTunnelTokenSymbol,
} from 'utils/token'
import { parseUnits as viemParseUnits } from 'viem'
import { describe, expect, it } from 'vitest'

const baseToken = {
  address: '0x123',
  chainId: 1,
  decimals: 18,
  name: 'Test Token',
  symbol: 'TOKEN',
}

describe('utils/token', function () {
  describe('getTokenPrice', function () {
    it('should return the price based in the token symbol', function () {
      const token = { ...baseToken, symbol: 'usdt' }
      const prices = { USDT: '0.99' }
      expect(getTokenPrice(token, prices)).toBe('0.99')
    })

    it('should return the price based in the token priceSymbol if defined', function () {
      const token = {
        ...baseToken,
        extensions: { priceSymbol: 'usdt' },
        symbol: 'usdt.e',
      }
      const prices = { USDT: '0.99' }
      expect(getTokenPrice(token, prices)).toBe('0.99')
    })
  })

  describe('isEvmToken', function () {
    it('should return true if token is an EVM token', function () {
      const token = { ...baseToken, symbol: 'EVM' }
      expect(isEvmToken(token)).toBe(true)
    })

    it('should return false if token is not an EVM token', function () {
      const token = {
        ...baseToken,
        chainId: 'testnet',
        decimals: 8,
        symbol: 'BTC',
      }
      expect(isEvmToken(token)).toBe(false)
    })
  })

  describe('isStakeToken', function () {
    it('should return true if token is a stake token', function () {
      const token = {
        ...baseToken,
        extensions: { protocol: 'bedRock' },
        symbol: 'STAKE',
      }
      expect(isStakeToken(token)).toBe(true)
    })

    it('should return false if token is not a stake token', function () {
      const token = { ...baseToken }
      expect(isStakeToken(token)).toBe(false)
    })
  })

  describe('isTunnelToken', function () {
    it('should return true if token is a tunnel token', function () {
      const token = {
        ...baseToken,
        extensions: { tunnel: true },
        symbol: 'TUNNEL',
      }
      expect(isTunnelToken(token)).toBe(true)
    })

    it('should return false if token is not a tunnel token', function () {
      const token = { ...baseToken }
      expect(isTunnelToken(token)).toBe(false)
    })
  })

  describe('tunnelsThroughPartner', function () {
    it('should return true if token tunnels through a partner', function () {
      const token = {
        ...baseToken,
        extensions: { tunnel: true, tunnelPartners: ['meson' as const] },
      }
      expect(tunnelsThroughPartners(token)).toBe(true)
    })

    it('should return false if token does not tunnel through a partner', function () {
      const token = { ...baseToken, extensions: { tunnel: true } }
      expect(tunnelsThroughPartners(token)).toBe(false)
    })
  })

  describe('parseTokenUnits', function () {
    const parseBaseToken = {
      address: '0x0',
      chainId: 1,
      name: 'TestToken',
      symbol: 'TT',
    }
    it('should parse integer amounts correctly', function () {
      const token = { ...parseBaseToken, decimals: 6 }
      expect(parseTokenUnits('123', token)).toEqual(
        viemParseUnits('123', token.decimals),
      )
    })

    it('should parse decimal amounts correctly', function () {
      const token = { ...parseBaseToken, decimals: 6 }
      expect(parseTokenUnits('123.456789', token)).toEqual(
        viemParseUnits('123.456789', token.decimals),
      )
    })

    it('should truncate decimals exceeding token.decimals', function () {
      const token = { ...parseBaseToken, decimals: 4 }
      expect(parseTokenUnits('1.123456', token)).toEqual(
        viemParseUnits('1.1234', token.decimals),
      )
    })

    it('should handle no fraction part', function () {
      const token = { ...parseBaseToken, decimals: 2 }
      expect(parseTokenUnits('42', token)).toEqual(
        viemParseUnits('42', token.decimals),
      )
    })

    it('should handle zero amount', function () {
      const token = { ...parseBaseToken, decimals: 8 }
      expect(parseTokenUnits('0', token)).toEqual(
        viemParseUnits('0', token.decimals),
      )
    })

    it('should handle large integer amounts', function () {
      const token = { ...parseBaseToken, decimals: 18 }
      const largeAmount = '123456789012345678901234567890'
      expect(parseTokenUnits(largeAmount, token)).toEqual(
        viemParseUnits(largeAmount, token.decimals),
      )
    })

    it('should handle large decimal amounts', function () {
      const token = { ...parseBaseToken, decimals: 18 }
      const largeDecimalAmount = '12345678901234567890.123456789012345678'
      expect(parseTokenUnits(largeDecimalAmount, token)).toEqual(
        viemParseUnits(largeDecimalAmount, token.decimals),
      )
    })

    it('should handle large decimal amounts with many digits, truncating excess decimals', function () {
      const token = { ...parseBaseToken, decimals: 18 }
      // 30 digits in integer part, 30 in decimal part, but only 18 decimals should be kept
      const largeDecimalAmount =
        '123456789012345678901234567890.123456789012345678901234567890'
      const expected = viemParseUnits(
        '123456789012345678901234567890.123456789012345678',
        token.decimals,
      )
      expect(parseTokenUnits(largeDecimalAmount, token)).toEqual(expected)
    })
  })

  describe('getTokenSymbol', function () {
    it('should return customSymbol if it exists in the token extensions', function () {
      const token = {
        ...baseToken,
        extensions: { customSymbol: 'cBTC' },
        symbol: 'BTC',
      }
      expect(getTokenSymbol(token)).toBe(token.extensions.customSymbol)
    })

    it('should return the token symbol if customSymbol does not exist in extensions', function () {
      expect(getTokenSymbol(baseToken)).toBe(baseToken.symbol)
    })
  })

  describe('getTunnelTokenSymbol', function () {
    it('should return tunnelSymbol if it exists in the token extensions', function () {
      const token = {
        ...baseToken,
        extensions: { customSymbol: 'cBTC', tunnelSymbol: 'tBTC' },
        symbol: 'BTC',
      }
      expect(getTunnelTokenSymbol(token)).toBe(token.extensions.tunnelSymbol)
    })

    it('should fall back to getTokenSymbol when no tunnel exist', function () {
      expect(getTunnelTokenSymbol(baseToken)).toBe(getTokenSymbol(baseToken))
    })
  })
})
