import { describe, expect, it } from 'vitest'

import {
  costBasisState,
  positionEarnedUsd,
} from '../../../../../app/[locale]/hemi-earn/_utils/earnedAmount'

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

  it('floors a position below cost to zero', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '100000000', // 1.0
      currentPegged: BigInt(99000000), // 0.99
      decimals: 8,
      price: '60000',
    })
    expect(result.toFixed(2)).toBe('0.00')
  })

  // The OFT dust: cents below cost, which toFixed(2) would render as '-0.00'
  // and which would otherwise eat into what another position earned.
  it('floors a sub-cent shortfall to zero', function () {
    const result = positionEarnedUsd({
      costBasisBaseUnits: '100000000',
      currentPegged: BigInt(99999999),
      decimals: 8,
      price: '1',
    })
    expect(result.toFixed(2)).toBe('0.00')
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

describe('costBasisState', function () {
  it('is pending while the query is fetching', function () {
    expect(
      costBasisState({ fetchStatus: 'fetching', status: 'pending' }),
    ).toEqual({ isCostBasisPending: true, isCostBasisUnavailable: false })
  })

  // An offline browser pauses the fetch; the data is still coming.
  it('is pending while the query is paused', function () {
    expect(
      costBasisState({ fetchStatus: 'paused', status: 'pending' }),
    ).toEqual({ isCostBasisPending: true, isCostBasisUnavailable: false })
  })

  // Disabled off mainnet: pending forever, so it must not read as loading.
  it('is unavailable when the query is disabled', function () {
    expect(costBasisState({ fetchStatus: 'idle', status: 'pending' })).toEqual({
      isCostBasisPending: false,
      isCostBasisUnavailable: true,
    })
  })

  it('is unavailable when the query errored', function () {
    expect(costBasisState({ fetchStatus: 'idle', status: 'error' })).toEqual({
      isCostBasisPending: false,
      isCostBasisUnavailable: true,
    })
  })

  it('is neither once the query resolves', function () {
    expect(costBasisState({ fetchStatus: 'idle', status: 'success' })).toEqual({
      isCostBasisPending: false,
      isCostBasisUnavailable: false,
    })
  })
})
