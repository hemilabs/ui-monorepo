import { describe, expect, it } from 'vitest'

import { replayCostBasis } from '../../src/hemi-earn/replay.ts'

const WAD = 10n ** 18n

const SHARE_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SHARE_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const deposit = (share: string, staked: string | null, shares: string) => ({
  kind: 'DEPOSIT' as const,
  share,
  shares,
  staked,
})

const redeem = (share: string, shares: string) => ({
  kind: 'REDEEM' as const,
  share,
  shares,
})

const transferIn = (
  share: string,
  value: string,
  rate: { denominator: string; numerator: string } | null,
) => ({ kind: 'TRANSFER_IN' as const, rate, share, value })

const transferOut = (share: string, value: string) => ({
  kind: 'TRANSFER_OUT' as const,
  share,
  value,
})

describe('replayCostBasis', function () {
  it('accrues a deposit as WAD-scaled cost basis + minted shares', function () {
    const positions = replayCostBasis([deposit(SHARE_A, '100', '50')])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 100n * WAD,
      shares: 50n,
    })
  })

  it('sums deposits into the same share', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '50'),
      deposit(SHARE_A, '40', '10'),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 140n * WAD,
      shares: 60n,
    })
  })

  it('reduces cost basis proportionally on a partial redeem', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      redeem(SHARE_A, '40'),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 60n * WAD,
      shares: 60n,
    })
  })

  it('zeroes the position on a full (or over-) redeem', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      redeem(SHARE_A, '100'),
    ])
    expect(positions.get(SHARE_A)).toEqual({ costBasis: 0n, shares: 0n })
  })

  it('keeps shares isolated — a redeem on one does not touch another', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      deposit(SHARE_B, '200', '50'),
      redeem(SHARE_A, '50'),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 50n * WAD,
      shares: 50n,
    })
    expect(positions.get(SHARE_B)).toEqual({
      costBasis: 200n * WAD,
      shares: 50n,
    })
  })

  it('tracks shares but no cost basis for a deposit missing its stakedAmount', function () {
    const positions = replayCostBasis([deposit(SHARE_A, null, '50')])
    expect(positions.get(SHARE_A)).toEqual({ costBasis: 0n, shares: 50n })
  })

  it('reduces against the full balance when a deposit lacks stakedAmount', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      deposit(SHARE_A, null, '50'),
      redeem(SHARE_A, '60'),
    ])
    // 100*WAD * (150 - 60) / 150 = 60*WAD
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 60n * WAD,
      shares: 90n,
    })
  })

  it('prices a transfer-in at the nearest rate (FMV), not pure profit', function () {
    // 10 shares received at rate 1.05 pegged/share → 10.5 pegged cost basis.
    const positions = replayCostBasis([
      transferIn(SHARE_A, '10', { denominator: '100', numerator: '105' }),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: (10n * 105n * WAD) / 100n,
      shares: 10n,
    })
  })

  it('adds no cost basis for a transfer-in with no rate available', function () {
    const positions = replayCostBasis([transferIn(SHARE_A, '10', null)])
    expect(positions.get(SHARE_A)).toEqual({ costBasis: 0n, shares: 10n })
  })

  it('reduces cost basis proportionally on a transfer-out', function () {
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      transferOut(SHARE_A, '40'),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 60n * WAD,
      shares: 60n,
    })
  })

  it('replays deposits and transfers together in order', function () {
    // deposit 100/100, transfer in 50 @ rate 1.0 (50 cost) → 150 basis / 150
    // shares, then redeem 30 → 150*WAD * 120/150 = 120*WAD.
    const positions = replayCostBasis([
      deposit(SHARE_A, '100', '100'),
      transferIn(SHARE_A, '50', { denominator: '1', numerator: '1' }),
      redeem(SHARE_A, '30'),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 120n * WAD,
      shares: 120n,
    })
  })

  it('prices a transfer-only position (never deposited) at FMV', function () {
    // 20 shares at rate 1.5 → 30 pegged, not zero (pure profit).
    const positions = replayCostBasis([
      transferIn(SHARE_A, '20', { denominator: '2', numerator: '3' }),
    ])
    expect(positions.get(SHARE_A)).toEqual({
      costBasis: 30n * WAD,
      shares: 20n,
    })
  })
})
