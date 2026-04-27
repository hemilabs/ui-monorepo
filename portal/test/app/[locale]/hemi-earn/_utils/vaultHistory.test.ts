import { describe, expect, it } from 'vitest'

import {
  calculateTvlHistory,
  type VaultHistoryPoint,
} from '../../../../../app/[locale]/hemi-earn/_utils/vaultHistory'

describe('vaultHistory', function () {
  describe('calculateTvlHistory', function () {
    it('should return empty array for empty history', function () {
      expect(calculateTvlHistory([], 18, '2000')).toEqual([])
    })

    it('should convert totalAssets to dollar value with 18 decimals', function () {
      const history: VaultHistoryPoint[] = [
        {
          shareValue: '1000000000000000000',
          timestamp: '1700000000',
          totalAssets: '1000000000000000000',
        },
      ]
      const result = calculateTvlHistory(history, 18, '2000')
      expect(result).toEqual([{ x: 1700000000000, y: 2000 }])
    })

    it('should convert totalAssets to dollar value with 8 decimals', function () {
      const history: VaultHistoryPoint[] = [
        {
          shareValue: '100000000',
          timestamp: '1700000000',
          totalAssets: '100000000',
        },
      ]
      const result = calculateTvlHistory(history, 8, '60000')
      expect(result).toEqual([{ x: 1700000000000, y: 60000 }])
    })

    it('should handle multiple points', function () {
      const history: VaultHistoryPoint[] = [
        {
          shareValue: '1000000000000000000',
          timestamp: '1700000000',
          totalAssets: '500000000000000000000',
        },
        {
          shareValue: '1000000000000000000',
          timestamp: '1700086400',
          totalAssets: '600000000000000000000',
        },
      ]
      const result = calculateTvlHistory(history, 18, '2000')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ x: 1700000000000, y: 1000000 })
      expect(result[1]).toEqual({ x: 1700086400000, y: 1200000 })
    })

    it('should return zero TVL when price is zero', function () {
      const history: VaultHistoryPoint[] = [
        {
          shareValue: '1000000000000000000',
          timestamp: '1700000000',
          totalAssets: '1000000000000000000',
        },
      ]
      const result = calculateTvlHistory(history, 18, '0')
      expect(result).toEqual([{ x: 1700000000000, y: 0 }])
    })

    it('should convert timestamps from seconds to milliseconds', function () {
      const history: VaultHistoryPoint[] = [
        {
          shareValue: '1000000000000000000',
          timestamp: '1700000000',
          totalAssets: '1000000000000000000',
        },
      ]
      const result = calculateTvlHistory(history, 18, '1')
      expect(result[0].x).toBe(1700000000000)
    })
  })
})
