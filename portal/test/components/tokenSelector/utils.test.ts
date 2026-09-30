import {
  getQuickSelectionTokens,
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

describe('getQuickSelectionTokens', function () {
  const eth = { address: 'ETH', symbol: 'ETH' }
  const hemi = { address: '0xHEMI', symbol: 'HEMI' }
  const hemiBtc = { address: '0xhemiBTC', symbol: 'hemiBTC' }
  const usdc = { address: '0xUSDC', symbol: 'USDC' }
  const tokens = [eth, hemi, hemiBtc, usdc]
  const priorityAddresses = ['0xHEMI', '0xhemiBTC', 'ETH', '0xUSDC']

  it('returns the priority tokens in order when there are no top tokens', function () {
    expect(
      getQuickSelectionTokens({ priorityAddresses, tokens, topTokens: [] }),
    ).toEqual([hemi, hemiBtc, eth])
  })

  it('returns the first 3 top tokens when there are enough', function () {
    expect(
      getQuickSelectionTokens({
        priorityAddresses,
        tokens,
        topTokens: [usdc, eth, hemiBtc, hemi],
      }),
    ).toEqual([usdc, eth, hemiBtc])
  })

  it('fills with priority tokens not already in the top tokens', function () {
    expect(
      getQuickSelectionTokens({
        priorityAddresses,
        tokens,
        topTokens: [hemiBtc],
      }),
    ).toEqual([hemiBtc, hemi, eth])
  })

  it('skips priority addresses missing from the token list', function () {
    expect(
      getQuickSelectionTokens({
        priorityAddresses,
        tokens: [eth, usdc],
        topTokens: [],
      }),
    ).toEqual([eth, usdc])
  })
})
