import { getAssetData } from 'hemi-earn-actions/actions'
import { type Address, zeroAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { getEarnCostBasis } from '../../src/hemi-earn/costBasis.ts'
import { requestHemiEarn } from '../../src/subgraphs/subgraph.ts'

vi.mock('../../src/subgraphs/subgraph.ts', () => ({
  checkGraphQLErrors: vi.fn(),
  paginateHemiEarnSubgraph: ({
    fetchPage,
  }: {
    fetchPage: (window: { limit: number; offset: number }) => Promise<unknown[]>
  }) => fetchPage({ limit: 100, offset: 0 }),
  requestHemiEarn: vi.fn(),
}))
vi.mock('hemi-earn-actions/actions', () => ({ getAssetData: vi.fn() }))

const account = '0x00000000000000000000000000000000000000a1'
const other = '0x00000000000000000000000000000000000000b2'

// nextAddress() hands out a fresh address on every call, so each test resolves
// distinct assets/shares and the module-level `shareByAssetCache` in costBasis.ts
// never collides across tests (the repo doesn't use resetModules).
const addressFrom = (n: number): Address =>
  `0x${n.toString(16).padStart(40, '0')}`
const seq = { current: 0 }
const nextAddress = () => addressFrom(++seq.current)

type RateRow = {
  rateDenominator: string
  rateNumerator: string
  timestamp: string
}

type RequestRow = {
  amountIn: string | null
  amountOut: string | null
  asset: string
  kind: 'DEPOSIT' | 'REDEEM'
  processedAt: string
  requestedAt: string | null
  stakedAmount: string | null
}

type TransferRow = {
  from: string
  share: string
  timestamp: string
  to: string
  value: string
}

const deposit = ({
  asset,
  requestedAt,
  shares,
  staked,
}: {
  asset: string
  requestedAt: string
  shares: string
  staked: string | null
}) => ({
  amountIn: null,
  amountOut: shares,
  asset,
  kind: 'DEPOSIT' as const,
  processedAt: requestedAt,
  requestedAt,
  stakedAmount: staked,
})

const redeem = ({
  asset,
  requestedAt,
  shares,
}: {
  asset: string
  requestedAt: string
  shares: string
}) => ({
  amountIn: shares,
  amountOut: null,
  asset,
  kind: 'REDEEM' as const,
  processedAt: requestedAt,
  requestedAt,
  stakedAmount: null,
})

const transferIn = ({
  share,
  timestamp,
  value,
}: {
  share: string
  timestamp: string
  value: string
}) => ({
  from: other,
  share,
  timestamp,
  to: account,
  value,
})

const transferOut = ({
  share,
  timestamp,
  value,
}: {
  share: string
  timestamp: string
  value: string
}) => ({
  from: account,
  share,
  timestamp,
  to: other,
  value,
})

const configure = function ({
  assets = [],
  rates = {},
  requests = [],
  shareByAsset = {},
  transfers = [],
}: {
  assets?: Address[]
  rates?: Record<string, RateRow>
  requests?: RequestRow[]
  shareByAsset?: Record<string, Address>
  transfers?: TransferRow[]
}) {
  vi.mocked(getAssetData).mockImplementation(async function (
    _client,
    { asset },
  ) {
    const share = shareByAsset[asset.toLowerCase()]
    if (!share) throw new Error(`no mock share for ${asset}`)
    return {
      enabled: true,
      remoteAsset: zeroAddress,
      remoteShare: zeroAddress,
      share,
    }
  })
  vi.mocked(requestHemiEarn).mockImplementation(async function ({
    query,
    variables,
  }) {
    if (query.includes('GetEarnCostBasis'))
      return { data: { Request: requests } }
    if (query.includes('GetShareTransfers'))
      return { data: { ShareTransfer: transfers } }
    if (query.includes('GetEarnAssets'))
      return { data: { RateSnapshot: assets.map(asset => ({ asset })) } }
    if (query.includes('GetRateBound')) {
      const rate = rates[String(variables?.asset).toLowerCase()]
      return { data: { RateSnapshot: rate ? [rate] : [] } }
    }
    throw new Error(`unexpected query: ${query}`)
  })
}

describe('getEarnCostBasis', function () {
  it('returns the WAD cost basis for a processed deposit', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      requests: [
        deposit({ asset, requestedAt: '1000', shares: '100', staked: '100' }),
      ],
      shareByAsset: { [asset]: share },
    })

    expect(await getEarnCostBasis({ address: account })).toEqual({
      [share]: '100',
    })
  })

  it('prices a transfer-only position at the nearest rate (FMV)', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      assets: [asset],
      rates: {
        [asset]: {
          rateDenominator: '100',
          rateNumerator: '105',
          timestamp: '1000',
        },
      },
      shareByAsset: { [asset]: share },
      transfers: [transferIn({ share, timestamp: '1000', value: '10' })],
    })

    // 10 shares at rate 1.05 pegged/share → 10.5 pegged cost basis.
    expect(await getEarnCostBasis({ address: account })).toEqual({
      [share]: '10.5',
    })
  })

  it('drops positions whose shares net to zero after a full redeem', async function () {
    const assetA = nextAddress()
    const shareA = nextAddress()
    const assetB = nextAddress()
    const shareB = nextAddress()
    configure({
      requests: [
        deposit({
          asset: assetA,
          requestedAt: '1000',
          shares: '100',
          staked: '100',
        }),
        redeem({ asset: assetA, requestedAt: '2000', shares: '100' }),
        deposit({
          asset: assetB,
          requestedAt: '1000',
          shares: '50',
          staked: '50',
        }),
      ],
      shareByAsset: { [assetA]: shareA, [assetB]: shareB },
    })

    const result = await getEarnCostBasis({ address: account })
    expect(result).not.toHaveProperty(shareA)
    expect(result).toEqual({ [shareB]: '50' })
  })

  it('skips the global-asset enumeration when there are no transfers', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      requests: [
        deposit({ asset, requestedAt: '1000', shares: '100', staked: '100' }),
      ],
      shareByAsset: { [asset]: share },
    })

    await getEarnCostBasis({ address: account })

    expect(requestHemiEarn).not.toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('GetEarnAssets'),
      }),
    )
  })

  it('enumerates global assets when there are transfers', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      assets: [asset],
      rates: {
        [asset]: {
          rateDenominator: '1',
          rateNumerator: '1',
          timestamp: '1000',
        },
      },
      shareByAsset: { [asset]: share },
      transfers: [transferIn({ share, timestamp: '1000', value: '10' })],
    })

    await getEarnCostBasis({ address: account })

    expect(requestHemiEarn).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('GetEarnAssets'),
      }),
    )
  })

  it('applies a same-timestamp request before a transfer (stable order)', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      requests: [
        deposit({ asset, requestedAt: '1000', shares: '100', staked: '100' }),
      ],
      shareByAsset: { [asset]: share },
      transfers: [transferOut({ share, timestamp: '1000', value: '40' })],
    })

    // Deposit-first: acquire 100 then dispose 40 → 60. Transfer-first would leave 100.
    expect(await getEarnCostBasis({ address: account })).toEqual({
      [share]: '60',
    })
  })

  it('resolves a share collision to the last asset when inverting shareByAsset', async function () {
    const assetX = nextAddress()
    const assetY = nextAddress()
    const share = nextAddress()
    configure({
      rates: {
        [assetX]: {
          rateDenominator: '1',
          rateNumerator: '1',
          timestamp: '1000',
        },
        [assetY]: {
          rateDenominator: '1',
          rateNumerator: '1',
          timestamp: '1000',
        },
      },
      requests: [
        deposit({
          asset: assetX,
          requestedAt: '1000',
          shares: '10',
          staked: '10',
        }),
        deposit({
          asset: assetY,
          requestedAt: '1000',
          shares: '10',
          staked: '10',
        }),
      ],
      shareByAsset: { [assetX]: share, [assetY]: share },
      transfers: [transferIn({ share, timestamp: '1000', value: '10' })],
    })

    await getEarnCostBasis({ address: account })

    expect(requestHemiEarn).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('GetRateBound'),
        variables: expect.objectContaining({ asset: assetY }),
      }),
    )
    expect(requestHemiEarn).not.toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('GetRateBound'),
        variables: expect.objectContaining({ asset: assetX }),
      }),
    )
  })

  it('drops an asset that fails to resolve without failing the request', async function () {
    const goodAsset = nextAddress()
    const goodShare = nextAddress()
    const badAsset = nextAddress()
    // badAsset has no entry, so getAssetData rejects for it and the defensive
    // catch in getEarnCostBasis must drop it rather than 500 the whole response.
    configure({
      requests: [
        deposit({
          asset: goodAsset,
          requestedAt: '1000',
          shares: '100',
          staked: '100',
        }),
        deposit({
          asset: badAsset,
          requestedAt: '1000',
          shares: '50',
          staked: '50',
        }),
      ],
      shareByAsset: { [goodAsset]: goodShare },
    })

    expect(await getEarnCostBasis({ address: account })).toEqual({
      [goodShare]: '100',
    })
  })

  it('resolves each asset only once, reusing the memoized share', async function () {
    const asset = nextAddress()
    const share = nextAddress()
    configure({
      requests: [
        deposit({ asset, requestedAt: '1000', shares: '100', staked: '100' }),
      ],
      shareByAsset: { [asset]: share },
    })

    await getEarnCostBasis({ address: account })
    await getEarnCostBasis({ address: account })

    expect(getAssetData).toHaveBeenCalledTimes(1)
  })
})
