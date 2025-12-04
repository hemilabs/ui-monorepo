import { updateRpcUrls } from 'networks/utils'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'

describe('networks/utils', function () {
  describe('updateRpcUrls', function () {
    it('should return the original chain when rpcUrlEnv is undefined', function () {
      const result = updateRpcUrls(mainnet)
      expect(result).toBe(mainnet)
    })

    it('should return the original chain when rpcUrlEnv is not a string', function () {
      // @ts-expect-error testing invalid input
      const result = updateRpcUrls(mainnet, null)
      expect(result).toBe(mainnet)
    })

    it('should return the original chain when rpcUrlEnv contains no valid URLs', function () {
      const result = updateRpcUrls(mainnet, 'invalid+also-invalid')
      expect(result).toBe(mainnet)
    })

    it('should update RPC URLs with valid URLs from environment string', function () {
      const rpcUrlEnv =
        'https://eth.drpc.org+https://ethereum-rpc.publicnode.com+https://1rpc.io/eth'
      const result = updateRpcUrls(mainnet, rpcUrlEnv)

      expect(result).toEqual({
        ...mainnet,
        rpcUrls: {
          default: {
            http: [
              'https://eth.drpc.org',
              'https://ethereum-rpc.publicnode.com',
              'https://1rpc.io/eth',
            ],
          },
        },
      })

      // Verify original RPC URLs are not kept
      mainnet.rpcUrls.default.http.forEach(originalUrl =>
        expect(result.rpcUrls.default.http).not.toContain(originalUrl),
      )
    })

    it('should filter out invalid URLs while keeping valid ones', function () {
      const rpcUrlEnv = 'https://eth.drpc.org+invalid-url+https://1rpc.io/eth'
      const result = updateRpcUrls(mainnet, rpcUrlEnv)

      expect(result).not.toBe(mainnet)
      expect(result).toEqual({
        ...mainnet,
        rpcUrls: {
          default: {
            http: ['https://eth.drpc.org', 'https://1rpc.io/eth'],
          },
        },
      })
    })

    it('should handle single valid URL', function () {
      const rpcUrlEnv = 'https://eth.drpc.org'
      const result = updateRpcUrls(mainnet, rpcUrlEnv)

      expect(result).not.toBe(mainnet)
      expect(result).toEqual({
        ...mainnet,
        rpcUrls: {
          default: {
            http: ['https://eth.drpc.org'],
          },
        },
      })
    })

    it('should handle empty string', function () {
      const result = updateRpcUrls(mainnet, '')
      expect(result).toBe(mainnet)
    })
  })
})
