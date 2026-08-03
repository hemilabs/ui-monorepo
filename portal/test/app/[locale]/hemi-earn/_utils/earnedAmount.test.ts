import { describe, expect, it } from 'vitest'

import { positionEarnedUsd } from '../../../../../app/[locale]/hemi-earn/_utils/earnedAmount'

describe('positionEarnedUsd', function () {
  // 8-dec pegged token (BTC-like); base units: 1e8 == 1 token.
  it('returns positive earned when current value exceeds cost basis', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '100000000', // 1.0
      currentPegged: BigInt(105000000), // 1.05
      decimals: 8,
      price: '60000',
    })
    expect(result.toFixed(2)).toBe('3000.00') // 0.05 * 60000
  })

  it('is zero when current value equals cost basis', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '100000000',
      currentPegged: BigInt(100000000),
      decimals: 8,
      price: '60000',
    })
    expect(result.toFixed(2)).toBe('0.00')
  })

  it('counts the whole value when cost basis is missing (0)', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '0',
      currentPegged: BigInt(100000000),
      decimals: 8,
      price: '60000',
    })
    expect(result.toFixed(2)).toBe('60000.00')
  })

  it('can be negative — no clamp', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '100000000', // 1.0
      currentPegged: BigInt(99000000), // 0.99
      decimals: 8,
      price: '60000',
    })
    expect(result.lt(0)).toBe(true)
    expect(result.toFixed(2)).toBe('-600.00')
  })

  it('handles fractional (WAD-precision) cost basis and 18 decimals', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '1000000000000000000', // 1.0
      currentPegged: BigInt('1500000000000000000'), // 1.5
      decimals: 18,
      price: '1',
    })
    expect(result.toFixed(2)).toBe('0.50')
  })
})
