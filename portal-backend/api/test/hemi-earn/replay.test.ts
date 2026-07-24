import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import { replayCostBasis } from '../../src/hemi-earn/replay.ts'

const WAD = 10n ** 18n

// Two assets settle into share A, one into share B (a share accepts many assets).
const SHARE_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SHARE_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const ASSET_A1 = '0x1111111111111111111111111111111111111111'
const ASSET_A2 = '0x2222222222222222222222222222222222222222'
const ASSET_B = '0x3333333333333333333333333333333333333333'

const shareByAsset: Record<string, Address> = {
  [ASSET_A1]: SHARE_A,
  [ASSET_A2]: SHARE_A,
  [ASSET_B]: SHARE_B,
}

const deposit = (asset: string, staked: string, shares: string) => ({
  amountIn: null,
  amountOut: shares,
  asset,
  kind: 'DEPOSIT' as const,
  stakedAmount: staked,
})

const redeem = (asset: string, shares: string) => ({
  amountIn: shares,
  amountOut: null,
  asset,
  kind: 'REDEEM' as const,
  stakedAmount: null,
})

describe('replayCostBasis', function () {
  it('accrues a deposit as WAD-scaled cost basis + minted shares', function () {
    const positions = replayCostBasis(
      [deposit(ASSET_A1, '100', '50')],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 100n * WAD,
      shares: 50n,
    })
  })

  it('sums deposits into the same share across different assets', function () {
    const positions = replayCostBasis(
      [deposit(ASSET_A1, '100', '50'), deposit(ASSET_A2, '40', '10')],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 140n * WAD,
      shares: 60n,
    })
  })

  it('reduces cost basis proportionally on a partial redeem', function () {
    // deposit 100 for 100 shares, then burn 40 shares → 60% of the basis remains.
    const positions = replayCostBasis(
      [deposit(ASSET_A1, '100', '100'), redeem(ASSET_A1, '40')],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 60n * WAD,
      shares: 60n,
    })
  })

  it('zeroes the position on a full (or over-) redeem', function () {
    const positions = replayCostBasis(
      [deposit(ASSET_A1, '100', '100'), redeem(ASSET_A1, '100')],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({ costBasis: 0n, shares: 0n })
  })

  it('keeps shares isolated — a redeem on one does not touch another', function () {
    const positions = replayCostBasis(
      [
        deposit(ASSET_A1, '100', '100'),
        deposit(ASSET_B, '200', '50'),
        redeem(ASSET_A1, '50'),
      ],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 50n * WAD,
      shares: 50n,
    })
    expect(positions.get(SHARE_B)).toEqual({
      costBasis: 200n * WAD,
      shares: 50n,
    })
  })

  it('ignores rows whose asset has no share mapping', function () {
    const positions = replayCostBasis(
      [deposit('0x9999999999999999999999999999999999999999', '100', '50')],
      shareByAsset,
    )
    expect(positions.size).toBe(0)
  })

  it('skips a deposit missing its stakedAmount (accrues nothing)', function () {
    const positions = replayCostBasis(
      [
        {
          amountIn: null,
          amountOut: '50',
          asset: ASSET_A1,
          kind: 'DEPOSIT' as const,
          stakedAmount: null,
        },
      ],
      shareByAsset,
    )
    expect(positions.get(SHARE_A)).toEqual({ costBasis: 0n, shares: 0n })
  })
})
