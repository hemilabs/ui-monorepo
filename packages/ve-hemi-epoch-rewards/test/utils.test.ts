import { describe, expect, it } from 'vitest'

import { getClaimSpan } from '../utils'

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
