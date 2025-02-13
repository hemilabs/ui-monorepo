import { isStakeToken, isTunnelToken, isEvmToken } from 'utils/token'
import { describe, expect, it } from 'vitest'

describe('utils/token', function () {
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
})
