import {
  getTokenBySymbol,
  getTokenPrice,
  isStakeToken,
  isTunnelToken,
  isEvmToken,
  tunnelsThroughPartners,
  parseTokenUnits,
  isCustomToken,
  isListedToken,
} from 'utils/token'
import { maxUint256, parseUnits as viemParseUnits } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

const baseToken = {
  address: '0x123',
  chainId: 1,
  decimals: 18,
  name: 'Test Token',
  symbol: 'TOKEN',
}

describe('utils/token', function () {
  describe('getTokenBySymbol', function () {
    it('should return the listed token with that symbol on the chain', function () {
      expect(getTokenBySymbol('HEMI', 43111)).toMatchObject({
        address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
        chainId: 43111,
        symbol: 'HEMI',
      })
    })

    it('should return undefined for a listed symbol on another chain', function () {
      expect(getTokenBySymbol('HEMI', 999999)).toBeUndefined()
    })

    it('should return undefined for a symbol that is not listed', function () {
      expect(getTokenBySymbol('NOT-LISTED', 43111)).toBeUndefined()
    })
  })

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

  describe('isListedToken', function () {
    it('should return true for a listed token', function () {
      expect(
        isListedToken({
          ...baseToken,
          address: '0x1596bE338B999E2376675C908168A7548C8B0525',
          chainId: 43111,
        }),
      ).toBe(true)
    })

    it('should match a listed token regardless of the address casing', function () {
      expect(
        isListedToken({
          ...baseToken,
          address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
          chainId: 1,
        }),
      ).toBe(true)
    })

    it('should return false for a listed address on another chain', function () {
      expect(
        isListedToken({
          ...baseToken,
          address: '0x1596bE338B999E2376675C908168A7548C8B0525',
          chainId: 1,
        }),
      ).toBe(false)
    })

    it('should return false for a token that is not listed', function () {
      expect(
        isListedToken({
          ...baseToken,
          address: '0x0000000000000000000000000000000000000001',
        }),
      ).toBe(false)
    })
  })

  describe('isCustomToken', function () {
    it('should return true if token exists in the user token list', function () {
      const userTokenList = [baseToken]
      const token = { ...baseToken }
      expect(isCustomToken(userTokenList, token)).toBe(true)
    })

    it('should return false if token is not in the user token list', function () {
      const userTokenList = []
      const token = { ...baseToken }
      expect(isCustomToken(userTokenList, token)).toBe(false)
    })

    it('should return false if chainId differs even with same address', function () {
      const userTokenList = [{ ...baseToken, chainId: 10 }]
      const token = { ...baseToken }
      expect(isCustomToken(userTokenList, token)).toBe(false)
    })

    it('should return false if address differs even with same chainId', function () {
      const userTokenList = [{ ...baseToken, address: '0xnot123' }]
      const token = { ...baseToken }
      expect(isCustomToken(userTokenList, token)).toBe(false)
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
        extensions: { tunnel: true, tunnelPartners: ['stargate' as const] },
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

    it('should clamp amounts above maxUint256 to maxUint256', function () {
      const token = { ...parseBaseToken, decimals: 18 }
      const amount =
        '1111111111111111111111111111111111111111111111111111111111111000000000000000000'
      expect(parseTokenUnits(amount, token)).toEqual(maxUint256)
    })

    it('should keep an amount equal to maxUint256', function () {
      const token = { ...parseBaseToken, decimals: 0 }
      expect(parseTokenUnits(maxUint256.toString(), token)).toEqual(maxUint256)
    })
  })
})
