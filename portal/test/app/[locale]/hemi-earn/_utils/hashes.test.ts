import { describe, expect, it } from 'vitest'

import { hashesMatch } from '../../../../../app/[locale]/hemi-earn/_utils/hashes'

describe('hashes', function () {
  describe('hashesMatch', function () {
    const lower = `0x${'a'.repeat(64)}` as const
    const upper = `0x${'A'.repeat(64)}` as const
    const other = `0x${'b'.repeat(64)}` as const

    it('matches identical hashes', function () {
      expect(hashesMatch(lower, lower)).toBe(true)
    })

    it('matches case-insensitively', function () {
      expect(hashesMatch(lower, upper)).toBe(true)
    })

    it('does not match different hashes', function () {
      expect(hashesMatch(lower, other)).toBe(false)
    })

    it('returns false when the first hash is undefined', function () {
      expect(hashesMatch(undefined, lower)).toBe(false)
    })

    it('returns false when the second hash is undefined', function () {
      expect(hashesMatch(lower, undefined)).toBe(false)
    })

    it('returns false when both are undefined', function () {
      expect(hashesMatch(undefined, undefined)).toBe(false)
    })
  })
})
