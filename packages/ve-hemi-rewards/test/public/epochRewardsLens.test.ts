import { readContract } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getClaimableByToken } from '../../actions/public/epochRewardsLens.ts'

vi.mock('viem/actions', () => ({ readContract: vi.fn() }))

const lensAddress = '0x00000000000000000000000000000000000000ab' as const
const holder = '0x00000000000000000000000000000000000000cd' as const
const hemi = '0x0000000000000000000000000000000000000001' as const
const hemiBtc = '0x0000000000000000000000000000000000000002' as const

const row = (token: string, claimable: bigint, carry = BigInt(0)) => ({
  carry,
  claimable,
  decimals: token === hemiBtc ? 8 : 18,
  symbol: token === hemiBtc ? 'hemiBTC' : 'HEMI',
  token,
})

const windowsRequested = () =>
  vi
    .mocked(readContract)
    .mock.calls.map(([, args]) => [Number(args.args[2]), Number(args.args[3])])

const call = (overrides = {}) =>
  getClaimableByToken({} as never, {
    fromEpoch: 3000,
    holder,
    lensAddress,
    toEpoch: 3000,
    tokenCount: 2,
    tokenId: BigInt(1),
    ...overrides,
  })

describe('getClaimableByToken', function () {
  beforeEach(function () {
    vi.mocked(readContract).mockResolvedValue([row(hemi, BigInt(10))])
  })

  it('asks for the whole range at once when it fits the budget', async function () {
    await call({ toEpoch: 3050 })

    expect(windowsRequested()).toEqual([[3000, 3050]])
  })

  // The Lens cannot be asked for a wide range: gas is (epochs x tokens), and the full
  // window on a mature deployment exceeds a node's eth_call cap.
  it('splits a wide range into windows sized by the token count', async function () {
    await call({ toEpoch: 3300 })

    // 192 pairs / 2 tokens = 96 epochs per window.
    expect(windowsRequested()).toEqual([
      [3000, 3095],
      [3096, 3191],
      [3192, 3287],
      [3288, 3300],
    ])
  })

  it('narrows the window as the registry grows', async function () {
    await call({ toEpoch: 3100, tokenCount: 8 })

    // 192 / 8 = 24 epochs per window.
    expect(windowsRequested().length).toBe(5)
    expect(windowsRequested()[0]).toEqual([3000, 3023])
  })

  it('sums claimable across windows, per asset', async function () {
    vi.mocked(readContract)
      .mockResolvedValueOnce([row(hemi, BigInt(10)), row(hemiBtc, BigInt(3))])
      .mockResolvedValueOnce([row(hemi, BigInt(5)), row(hemiBtc, BigInt(1))])

    const rows = await call({ toEpoch: 3100 })

    expect(rows.find(r => r.token === hemi)?.claimable).toBe(BigInt(15))
    expect(rows.find(r => r.token === hemiBtc)?.claimable).toBe(BigInt(4))
  })

  // carry is per (position, token, holder), not per range - the same value comes back
  // in every window. Summing it would multiply a figure that is already inside
  // `claimable` by the number of windows the range happened to need.
  it('carries dust through rather than summing it', async function () {
    vi.mocked(readContract)
      .mockResolvedValueOnce([row(hemi, BigInt(10), BigInt(7))])
      .mockResolvedValueOnce([row(hemi, BigInt(5), BigInt(7))])

    const rows = await call({ toEpoch: 3100 })

    expect(rows[0].carry).toBe(BigInt(7))
  })

  it('keeps each asset decimals alongside its amount', async function () {
    vi.mocked(readContract).mockResolvedValue([
      row(hemi, BigInt(10)),
      row(hemiBtc, BigInt(3)),
    ])

    const rows = await call()

    expect(rows.map(r => [r.symbol, r.decimals])).toEqual([
      ['HEMI', 18],
      ['hemiBTC', 8],
    ])
  })

  // The plan names this as the failure mode to avoid: "A failed read page must surface
  // as an error, never as zero - a paged sum that swallows a failure under-reports what
  // the user is about to sign for." A partial sum would be worse than no answer.
  it('rejects rather than returning a partial sum when a window fails', async function () {
    vi.mocked(readContract)
      .mockResolvedValueOnce([row(hemi, BigInt(10))])
      .mockRejectedValueOnce(new Error('eth_call failed'))

    await expect(call({ toEpoch: 3100 })).rejects.toThrow('eth_call failed')
  })

  it('asks the Lens for the right thing', async function () {
    await call({ toEpoch: 3010 })

    const [, args] = vi.mocked(readContract).mock.calls[0]
    expect(args.address).toBe(lensAddress)
    expect(args.functionName).toBe('claimableByToken')
    expect(args.args?.slice(0, 2)).toEqual([BigInt(1), holder])
  })
})
