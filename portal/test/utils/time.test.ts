import { secondsToHours } from 'utils/time'
import { describe, expect, it } from 'vitest'

describe('utils/time', function () {
  describe('secondsToHours', function () {
    it('should convert seconds to hours correctly', function () {
      const result = secondsToHours(43200)
      expect(result).toBe(12)
    })
  })
})
