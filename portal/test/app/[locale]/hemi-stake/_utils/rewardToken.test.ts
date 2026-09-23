import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import { findRewardToken } from '../../../../../app/[locale]/hemi-stake/_utils/rewardToken'

const hemi = '0x99e3dE3817F6081B2568208337ef83295b7f591D' as Address
const hemiBtc = '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28' as Address

const token = (address: string, symbol: string) =>
  ({ address, chainId: 43111, decimals: 18, name: symbol, symbol }) as EvmToken

describe('findRewardToken', function () {
  const tokens = [token(hemi, 'HEMI'), token(hemiBtc, 'hemiBTC')]

  it('finds the token that matches the address', function () {
    expect(findRewardToken(tokens, hemiBtc)?.symbol).toBe('hemiBTC')
  })

  it('matches regardless of casing', function () {
    expect(findRewardToken(tokens, hemi.toLowerCase() as Address)?.symbol).toBe(
      'HEMI',
    )
    expect(
      findRewardToken([token(hemi.toLowerCase(), 'HEMI')], hemi)?.symbol,
    ).toBe('HEMI')
  })

  it('returns undefined when no token matches', function () {
    expect(
      findRewardToken(tokens, `0x${'1'.repeat(40)}` as Address),
    ).toBeUndefined()
  })

  it('walks past entries whose address is not an address', function () {
    // Native tokens carry their symbol in `address`, and isAddressEqual throws
    // on those, so the search has to skip them instead of blowing up.
    const withNative = [token('BTC', 'BTC'), ...tokens]

    expect(() => findRewardToken(withNative, hemi)).not.toThrow()
    expect(findRewardToken(withNative, hemi)?.symbol).toBe('HEMI')
  })

  it('handles an empty list', function () {
    expect(findRewardToken([], hemi)).toBeUndefined()
  })
})
