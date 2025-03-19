import {
  getTokenPrice,
  isStakeToken,
  isTunnelToken,
  isEvmToken,
  tunnelsThroughPartners,
} from 'utils/token'
import { describe, expect, it } from 'vitest'

describe('utils/token', function () {
  describe('getTokenPrice', function () {
    it('should return the price based in the token symbol', function () {
      const token = { symbol: 'usdt' }
      const prices = { USDT: '0.99' }
      expect(getTokenPrice(token, prices)).toBe('0.99')
    })

    it('should return the price based in the token priceSymbol if defined', function () {
      const token = { extensions: { priceSymbol: 'usdt' }, symbol: 'usdt.e' }
      const prices = { USDT: '0.99' }
      expect(getTokenPrice(token, prices)).toBe('0.99')
    })
  })

  describe('isEvmToken', function () {
    it('should return true if token is an EVM token', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        symbol: 'EVM',
      }
      expect(isEvmToken(token)).toBe(true)
    })

    it('should return false if token is not an EVM token', function () {
      const token = {
        address: '0x123',
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
        address: '0x123',
        chainId: 1,
        decimals: 18,
        extensions: {
          protocol: 'bedRock',
        },
        symbol: 'STAKE',
      }
      expect(isStakeToken(token)).toBe(true)
    })

    it('should return false if token is not a stake token', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        symbol: 'TOKEN',
      }
      expect(isStakeToken(token)).toBe(false)
    })
  })

  describe('isTunnelToken', function () {
    it('should return true if token is a tunnel token', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        extensions: {
          tunnel: true,
        },
        symbol: 'TUNNEL',
      }
      expect(isTunnelToken(token)).toBe(true)
    })

    it('should return false if token is not a tunnel token', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        symbol: 'TOKEN',
      }
      expect(isTunnelToken(token)).toBe(false)
    })
  })

  describe('tunnelsThroughPartner', function () {
    it('should return true if token tunnels through a partner', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        extensions: {
          tunnel: true,
          tunnelPartners: ['partner'],
        },
        symbol: 'TOKEN',
      }

      expect(tunnelsThroughPartners(token)).toBe(true)
    })

    it('should return false if token does not tunnel through a partner', function () {
      const token = {
        address: '0x123',
        chainId: 1,
        decimals: 18,
        extensions: {
          tunnel: true,
        },
        symbol: 'TOKEN',
      }

      expect(tunnelsThroughPartners(token)).toBe(false)
    })
  })
})
