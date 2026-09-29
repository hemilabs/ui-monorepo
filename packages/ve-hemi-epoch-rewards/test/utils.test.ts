import { describe, expect, it } from 'vitest'

import { getClaimSpan, isEpoch } from '../utils'

describe('getClaimSpan', function () {
  const bounds = { maxClaimEpochs: 64, maxClaimPairs: 96 }

  it('should narrow the span so every reward token fits one claim', function () {
    expect(getClaimSpan({ ...bounds, tokenCount: 2 })).toBe(48)
    expect(getClaimSpan({ ...bounds, tokenCount: 3 })).toBe(32)
    expect(getClaimSpan({ ...bounds, tokenCount: 8 })).toBe(12)
  })

  it('should not go past the epoch bound when few tokens are registered', function () {
    expect(getClaimSpan({ ...bounds, tokenCount: 1 })).toBe(64)
  })

  it('should never return less than one epoch', function () {
    expect(getClaimSpan({ ...bounds, tokenCount: 200 })).toBe(1)
  })

  it('should tolerate an empty registry', function () {
    expect(getClaimSpan({ ...bounds, tokenCount: 0 })).toBe(64)
  })

  it('should follow the bounds rather than assume them', function () {
    expect(
      getClaimSpan({ maxClaimEpochs: 30, maxClaimPairs: 96, tokenCount: 2 }),
    ).toBe(30)
    expect(
      getClaimSpan({ maxClaimEpochs: 64, maxClaimPairs: 192, tokenCount: 2 }),
    ).toBe(64)
  })
})

describe('isEpoch', function () {
  it('should accept a whole epoch, zero included', function () {
    expect(isEpoch(0)).toBe(true)
    expect(isEpoch(3404)).toBe(true)
  })

  it('should reject an epoch before the first one', function () {
    expect(isEpoch(-1)).toBe(false)
  })

  it('should reject an epoch that is not a whole number', function () {
    expect(isEpoch(3404.5)).toBe(false)
  })

  it('should reject what is not a number at all', function () {
    expect(isEpoch(NaN)).toBe(false)
    expect(isEpoch(Infinity)).toBe(false)
  })
})
