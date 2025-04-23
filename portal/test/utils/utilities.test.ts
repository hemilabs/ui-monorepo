import { hasKeys } from 'utils/utilities'
import { describe, expect, it } from 'vitest'

describe('utils/utilities', function () {
  describe('hasKeys()', function () {
    it('returns false for an empty object', function () {
      expect(hasKeys({})).toBe(false)
    })

    it('returns true for an object with keys', function () {
      expect(hasKeys({ a: 1 })).toBe(true)
    })
  })
})
