import { describe, expect, it } from 'vitest'

import { formatApyDisplay } from '../../../../../app/[locale]/hemi-earn/_utils/formatApy'

describe('formatApy', function () {
  describe('formatApyDisplay', function () {
    it('should return "< 0.01%" for tiny positive values', function () {
      expect(formatApyDisplay(0.005)).toBe('< 0.01%')
    })

    it('should return "< -0.01%" for tiny negative values', function () {
      expect(formatApyDisplay(-0.005)).toBe('< -0.01%')
    })

    it('should return "0.00%" for zero', function () {
      expect(formatApyDisplay(0)).toBe('0.00%')
    })

    it('should format percentage for negative values beyond the threshold', function () {
      expect(formatApyDisplay(-5.25)).toBe('-5.25%')
    })

    it('should format percentage for value equal to 0.01', function () {
      expect(formatApyDisplay(0.01)).toBe('0.01%')
    })

    it('should format percentage for larger values', function () {
      expect(formatApyDisplay(5.25)).toBe('5.25%')
    })
  })
})
