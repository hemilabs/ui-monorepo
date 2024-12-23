import {
  formatBtcAddress,
  formatEvmAddress,
  getFormattedValue,
} from 'utils/format'
import { describe, expect, it } from 'vitest'

describe('utils/format', function () {
  describe('formatBtcAddress', function () {
    it('should format a btc address correctly', function () {
      expect(
        formatBtcAddress('bc1qcup4k9q7j0gsjfcv2nqfeu88wjcs9wv0jfuu56'),
      ).toBe('bc1qc...fuu56')
    })
  })

  describe('formatEvmAddress', function () {
    it('should format an evm address correctly', function () {
      expect(
        formatEvmAddress('0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263'),
      ).toBe('0x4675...a263')
    })
  })

  describe('getFormattedValue', function () {
    it('should return "< 0.001" if the value is less than that', function () {
      expect(getFormattedValue('0.00001')).toBe('< 0.001')
    })
  })
})
