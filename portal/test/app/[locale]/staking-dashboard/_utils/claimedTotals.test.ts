import { claimedTotals } from 'app/[locale]/staking-dashboard/_utils/claimedTotals'
import { describe, expect, it } from 'vitest'

const hemi = '0xAAAA' as const
const hemiBtc = '0xBBBB' as const

const assets = [
  { address: hemi, decimals: 18, symbol: 'HEMI' },
  { address: hemiBtc, decimals: 8, symbol: 'hemiBTC' },
]

const paid = (tokenId: bigint, token: string, amount: bigint) => ({
  amount,
  token: token as `0x${string}`,
  tokenId,
})

describe('claimedTotals', function () {
  // One claim is signed in chunks, each emitting its own event over a disjoint range.
  it('sums the events of a chunked claim', function () {
    const totals = claimedTotals({
      assets,
      rows: [
        paid(BigInt(1), hemi, BigInt(30)),
        paid(BigInt(1), hemi, BigInt(12)),
      ],
    })
    expect(totals).toEqual([
      { claimable: BigInt(42), decimals: 18, symbol: 'HEMI', token: hemi },
    ])
  })

  it('keeps assets apart and carries each one decimals', function () {
    const totals = claimedTotals({
      assets,
      rows: [
        paid(BigInt(1), hemi, BigInt(30)),
        paid(BigInt(1), hemiBtc, BigInt(7)),
      ],
    })
    expect(totals).toEqual([
      { claimable: BigInt(30), decimals: 18, symbol: 'HEMI', token: hemi },
      { claimable: BigInt(7), decimals: 8, symbol: 'hemiBTC', token: hemiBtc },
    ])
  })

  it('totals every position when no position is named', function () {
    const totals = claimedTotals({
      assets,
      rows: [
        paid(BigInt(1), hemi, BigInt(30)),
        paid(BigInt(6), hemi, BigInt(12)),
      ],
    })
    expect(totals[0].claimable).toBe(BigInt(42))
  })

  it('narrows to one position when named', function () {
    const totals = claimedTotals({
      assets,
      rows: [
        paid(BigInt(1), hemi, BigInt(30)),
        paid(BigInt(6), hemi, BigInt(12)),
      ],
      tokenId: BigInt(6),
    })
    expect(totals[0].claimable).toBe(BigInt(12))
  })

  // The registry is checksummed and the logs are not guaranteed to be.
  it('matches an asset whatever the address casing', function () {
    const totals = claimedTotals({
      assets,
      rows: [paid(BigInt(1), hemi.toLowerCase(), BigInt(5))],
    })
    expect(totals).toEqual([
      { claimable: BigInt(5), decimals: 18, symbol: 'HEMI', token: hemi },
    ])
  })

  // A range that resolved owing nothing still emits an event.
  it('ignores zero-amount events', function () {
    expect(
      claimedTotals({ assets, rows: [paid(BigInt(1), hemi, BigInt(0))] }),
    ).toEqual([])
  })

  it('reports nothing before the history has loaded', function () {
    expect(claimedTotals({ assets, rows: undefined })).toEqual([])
  })

  // An asset registered after this wallet last claimed has no history, and a row of
  // zeros beside the ones that do have history would just be noise.
  it('leaves out assets nothing was paid in', function () {
    const totals = claimedTotals({
      assets,
      rows: [paid(BigInt(1), hemi, BigInt(30))],
    })
    expect(totals.map(total => total.symbol)).toEqual(['HEMI'])
  })
})
