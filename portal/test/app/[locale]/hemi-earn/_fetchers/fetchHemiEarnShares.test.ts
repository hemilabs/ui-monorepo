import {
  fetchHemiEarnShares,
  peggedTokenForShareQueryOptions,
} from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares'
import {
  getHemiEarnShares,
  getHemiEarnSupportedAssets,
  SVETBTC_OFT_ADDRESS,
} from 'hemi-earn-actions'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under vitest)
// through the chainClients → transport import chain. The queryFn that would
// use the client is never invoked here because the cache is seeded.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getHemiClient: vi.fn(),
}))

// Override only the registry getters — leave addresses/`getPeggedTokenForShare`
// untouched so `getHemiEarnToken` keeps resolving real curated tokens.
vi.mock('hemi-earn-actions', async function (importOriginal) {
  const actual = await importOriginal<typeof import('hemi-earn-actions')>()
  return {
    ...actual,
    getHemiEarnShares: vi.fn(),
    getHemiEarnSupportedAssets: vi.fn(),
  }
})

// Curated portal token list keys lookups by checksummed address; vetBTC is
// the canonical pegged token registered in the local `HEMI_EARN_TOKENS` map.
const VETBTC_PEGGED_ADDRESS =
  '0xf196C68233464A16CFDa319a47c21f4cECa62001' as Address
const UNKNOWN_PEGGED_ADDRESS =
  '0x0000000000000000000000000000000000000bad' as Address

describe('app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares', function () {
  beforeEach(function () {
    vi.mocked(getHemiEarnShares).mockReturnValue([])
    vi.mocked(getHemiEarnSupportedAssets).mockReturnValue([])
  })

  it('returns a skeleton for a share with at least one registered asset', async function () {
    vi.mocked(getHemiEarnShares).mockReturnValue([SVETBTC_OFT_ADDRESS])
    vi.mocked(getHemiEarnSupportedAssets).mockReturnValue([
      { asset: VETBTC_PEGGED_ADDRESS, share: SVETBTC_OFT_ADDRESS },
    ])

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      peggedTokenForShareQueryOptions(SVETBTC_OFT_ADDRESS).queryKey,
      VETBTC_PEGGED_ADDRESS,
    )

    const result = await fetchHemiEarnShares({ queryClient })

    expect(result).toHaveLength(1)
    expect(result[0].shareAddress).toBe(SVETBTC_OFT_ADDRESS)
    expect(result[0].peggedToken.symbol).toBe('vetBTC')
    expect(result[0].shareToken.symbol).toBe('svetBTC')
    expect(result[0].assets).toHaveLength(1)
    expect(result[0].assets[0].token.symbol).toBe('vetBTC')
  })

  it('skips a share whose pegged token is not in the curated list', async function () {
    vi.mocked(getHemiEarnShares).mockReturnValue([SVETBTC_OFT_ADDRESS])
    vi.mocked(getHemiEarnSupportedAssets).mockReturnValue([
      { asset: VETBTC_PEGGED_ADDRESS, share: SVETBTC_OFT_ADDRESS },
    ])

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      peggedTokenForShareQueryOptions(SVETBTC_OFT_ADDRESS).queryKey,
      UNKNOWN_PEGGED_ADDRESS,
    )

    const result = await fetchHemiEarnShares({ queryClient })
    expect(result).toEqual([])
  })

  it('skips a share with no registered deposit assets', async function () {
    vi.mocked(getHemiEarnShares).mockReturnValue([SVETBTC_OFT_ADDRESS])
    vi.mocked(getHemiEarnSupportedAssets).mockReturnValue([])

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      peggedTokenForShareQueryOptions(SVETBTC_OFT_ADDRESS).queryKey,
      VETBTC_PEGGED_ADDRESS,
    )

    const result = await fetchHemiEarnShares({ queryClient })
    expect(result).toEqual([])
  })

  it('returns an empty array when no shares are registered', async function () {
    const queryClient = createTestQueryClient()
    const result = await fetchHemiEarnShares({ queryClient })
    expect(result).toEqual([])
  })
})
