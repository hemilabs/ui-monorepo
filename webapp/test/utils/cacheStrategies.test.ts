import { withdrawalsStrategy } from 'utils/cacheStrategies'
import { describe, expect, it } from 'vitest'

describe('utils/cacheStrategies', function () {
  describe('withdrawalsStrategy', function () {
    it('should return undefined the RPC call has no parameters', () => {
      const result = withdrawalsStrategy.resolver('eth_call', [])
      expect(result).toBeUndefined()
    })

    it('should return undefined if data is not a valid hex', function () {
      const result = withdrawalsStrategy.resolver('eth_call', [
        { data: 'invalid', to: '0x123' },
      ])
      expect(result).toBeUndefined()
    })

    it('should return a valid caching strategy for the known methods', function () {
      const data = '0x54fd4d50' // keccak256 of "version()"
      const result = withdrawalsStrategy.resolver('eth_call', [
        { data, to: '0x123' },
      ])
      expect(result).toBe('permanent')
    })

    it('should return undefined for a valid eth_call with unknown method', function () {
      const result = withdrawalsStrategy.resolver('eth_call', [
        { data: '0x123456AF', to: '0x123' },
      ])
      expect(result).toBeUndefined()
    })
  })
})
