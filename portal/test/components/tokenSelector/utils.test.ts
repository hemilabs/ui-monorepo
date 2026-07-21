import {
  isSymbolTooLong,
  maxSymbolLength,
} from 'components/tokenSelector/utils'
import { describe, expect, it } from 'vitest'

describe('isSymbolTooLong', function () {
  it('returns false for short symbols', function () {
    expect(isSymbolTooLong('ETH')).toBe(false)
  })

  it('returns false for symbols of exactly the max length', function () {
    expect(isSymbolTooLong('a'.repeat(maxSymbolLength))).toBe(false)
  })

  it('returns true for longer symbols', function () {
    expect(isSymbolTooLong('mooStakeDao-VUSD-crvUSD')).toBe(true)
  })
})
