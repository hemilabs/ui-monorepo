import { describe, expect, it } from 'vitest'

import { chunksFor, claimSpan } from '../../actions/public/epochClaimPlan.ts'

describe('claimSpan', function () {
  it('is bounded by the epoch x token product, not the epoch bound alone', function () {
    expect(
      claimSpan({ maxClaimEpochs: 64, maxClaimPairs: 96, tokenCount: 2 }),
    ).toBe(48)
    expect(
      claimSpan({ maxClaimEpochs: 64, maxClaimPairs: 96, tokenCount: 8 }),
    ).toBe(12)
  })

  it('never proposes a span below one', function () {
    expect(
      claimSpan({ maxClaimEpochs: 64, maxClaimPairs: 96, tokenCount: 1000 }),
    ).toBe(1)
  })

  it('is bounded by the epoch bound when the registry is small', function () {
    expect(
      claimSpan({ maxClaimEpochs: 64, maxClaimPairs: 96, tokenCount: 1 }),
    ).toBe(64)
  })
})

describe('chunksFor', function () {
  it('covers the range contiguously without overlap', function () {
    const chunks = chunksFor({ fromEpoch: 10, span: 4, toEpoch: 20 })

    expect(chunks).toEqual([
      { from: 10, to: 13 },
      { from: 14, to: 17 },
      { from: 18, to: 20 },
    ])
  })

  it('emits a single chunk for a single epoch', function () {
    expect(chunksFor({ fromEpoch: 7, span: 64, toEpoch: 7 })).toEqual([
      { from: 7, to: 7 },
    ])
  })
})
