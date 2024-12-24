import { getBitcoinTimestamp } from 'utils/bitcoin'
import { describe, expect, it, vi } from 'vitest'

describe('utils/bitcoin', function () {
  describe('getBitcoinTimestamp', function () {
    it('should return the block time if is prior to the current time', function () {
      // using 5 minutes ago
      const blockTime = Math.floor((new Date().getTime() - 5 * 1000) / 1000)

      expect(getBitcoinTimestamp(blockTime)).toBe(blockTime)
    })

    it('should return the current time if the block time is in the future', function () {
      const now = new Date(2024, 11, 19).getTime()
      // using 5 minutes from now
      const blockTime = Math.floor((now + 5 * 1000) / 1000)
      vi.setSystemTime(now)

      expect(getBitcoinTimestamp(blockTime)).toBe(Math.floor(now / 1000))
    })
  })
})
