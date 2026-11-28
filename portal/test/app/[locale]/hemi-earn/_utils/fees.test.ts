import { describe, expect, it } from 'vitest'

import { bpsToPercent } from '../../../../../app/[locale]/hemi-earn/_utils/fees'

describe('fees', function () {
  describe('bpsToPercent', function () {
    it('reads a fee the gateways actually charge', function () {
      expect(bpsToPercent(BigInt(7))).toBe(0.07)
      expect(bpsToPercent(BigInt(15))).toBe(0.15)
    })

    it('keeps a free operation at zero', function () {
      expect(bpsToPercent(BigInt(0))).toBe(0)
    })

    it('treats the whole denominator as one hundred percent', function () {
      expect(bpsToPercent(BigInt(10000))).toBe(100)
    })

    it('does not lose a single basis point', function () {
      expect(bpsToPercent(BigInt(1))).toBe(0.01)
    })

    it('rejects a value the gateway could never mean as a fee', function () {
      expect(() => bpsToPercent(BigInt(10001))).toThrow(RangeError)
      expect(() => bpsToPercent(BigInt(-1))).toThrow(RangeError)
      expect(() => bpsToPercent(BigInt('1000000000000000000'))).toThrow(
        RangeError,
      )
    })
  })
})
