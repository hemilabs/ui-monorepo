import { getTunnelPairs } from 'utils/tunnelPairs'
import { describe, expect, it } from 'vitest'

const bridgeInfo = { '1': { tokenAddress: '0x1' } }
const peers = { '1': { tokenAddress: '0x2' } }

describe('utils/tunnelPairs', function () {
  describe('getTunnelPairs', function () {
    it('should return the bridgeInfo pairs', function () {
      expect(getTunnelPairs({ bridgeInfo, oft: { peers } })).toBe(bridgeInfo)
    })

    it('should fall back to the OFT peers if there is no bridgeInfo', function () {
      expect(getTunnelPairs({ oft: { peers } })).toBe(peers)
    })

    it('should return undefined if there are no extensions', function () {
      expect(getTunnelPairs(undefined)).toBeUndefined()
    })
  })
})
