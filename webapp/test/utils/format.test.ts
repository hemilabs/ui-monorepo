import {
  formatBtcAddress,
  formatEvmAddress,
  formatEvmHash,
  formatLargeFiatNumber,
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

  describe('formatTxHash', function () {
    it('should format an tx hash correctly', function () {
      expect(
        formatEvmHash(
          '0x5a3f5c2b87c9e4d1e3e0e5c27691d3a04e94f08b3f6a1d4b4d6b96e20b91c8e6',
        ),
      ).toBe('0x5a3f...c8e6')
    })
  })

  describe('formatLargeFiatNumber', function () {
    describe('formatLargeFiatNumber', function () {
      it('should format a number less than one million correctly', function () {
        expect(formatLargeFiatNumber(999999)).toBe('999,999.00')
      })

      it('should format a number equal to one million correctly', function () {
        expect(formatLargeFiatNumber(1000000)).toBe('1M')
      })

      it('should format a number greater than one million correctly', function () {
        expect(formatLargeFiatNumber(2500000)).toBe('2.5M')
      })

      it('should format a string number less than one million correctly', function () {
        expect(formatLargeFiatNumber('999999')).toBe('999,999.00')
      })

      it('should format a string number equal to one million correctly', function () {
        expect(formatLargeFiatNumber('1000000')).toBe('1M')
      })

      it('should format a string number greater than one million correctly', function () {
        expect(formatLargeFiatNumber('2500000')).toBe('2.5M')
      })
    })
  })
})
