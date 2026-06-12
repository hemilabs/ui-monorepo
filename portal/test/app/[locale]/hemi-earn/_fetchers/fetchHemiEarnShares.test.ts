import {
  type HemiEarnAssetConfig,
  hemiEarnAssetConfigsQueryOptions,
} from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnAssetConfigs'
import { fetchHemiEarnShares } from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares'
import { vaultAssetQueryOptions } from 'app/[locale]/hemi-earn/_hooks/vaultAsset'
import { hemi } from 'hemi-viem'
import { getUseTokenQueryKey } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under vitest)
// through the chainClients → transport import chain. The on-chain erc20
// fallback in `tokenQueryOptions` is never reached for seeded tokens; an
// unseeded token resolves to `undefined` (the mocked client makes the read
// throw), which is the "skip" path exercised below.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getPublicClient: vi.fn(),
}))

const SVETBTC = '0xD8D63De3b64bd06d99F8F5AD8B78Ed2fE7525eC0' as Address
// Any Ethereum-side staking vault address; the `asset()` read off it is seeded.
const REMOTE_SHARE = '0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e' as Address
// The pegged token is the staking vault's `asset()` — an Ethereum-mainnet token.
const VETBTC = '0xf196C68233464A16CFDa319a47c21f4cECa62001' as Address
const ASSET = '0x1111111111111111111111111111111111111111' as Address
const ASSET_2 = '0x2222222222222222222222222222222222222222' as Address
const REMOTE_ASSET = '0x3333333333333333333333333333333333333333' as Address
const UNKNOWN_ADDRESS = '0x0000000000000000000000000000000000000bad' as Address

const makeToken = (
  address: Address,
  symbol: string,
  chainId: EvmToken['chainId'],
): EvmToken => ({ address, chainId, decimals: 18, name: symbol, symbol })

// Share + deposit assets live on Hemi; the pegged token lives on Ethereum
// mainnet (the vault's `asset()`), so each is looked up on its own chain.
const svetBtcToken = makeToken(SVETBTC, 'svetBTC', hemi.id)
const vetBtcToken = makeToken(VETBTC, 'vetBTC', mainnet.id)
const assetToken = makeToken(ASSET, 'hemiBTC', hemi.id)
const asset2Token = makeToken(ASSET_2, 'enzoBTC', hemi.id)

const makeConfig = (
  config: Pick<HemiEarnAssetConfig, 'asset' | 'share'> &
    Partial<HemiEarnAssetConfig>,
): HemiEarnAssetConfig => ({
  enabled: true,
  remoteAsset: REMOTE_ASSET,
  remoteShare: REMOTE_SHARE,
  ...config,
})

// Seeds the asset-config + vault-asset + token-metadata caches so the fetcher
// resolves everything from the cache instead of hitting the network.
const seed = function (
  queryClient: ReturnType<typeof createTestQueryClient>,
  {
    configs,
    peggedAddress,
    tokens = [svetBtcToken, vetBtcToken, assetToken, asset2Token],
  }: {
    configs: HemiEarnAssetConfig[]
    peggedAddress: Address
    tokens?: EvmToken[]
  },
) {
  queryClient.setQueryData(hemiEarnAssetConfigsQueryOptions().queryKey, configs)
  queryClient.setQueryData(
    vaultAssetQueryOptions(REMOTE_SHARE).queryKey,
    peggedAddress,
  )
  for (const token of tokens) {
    queryClient.setQueryData(
      getUseTokenQueryKey(token.address, token.chainId),
      token,
    )
  }
}

describe('app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares', function () {
  it('returns a skeleton for a share with at least one registered asset', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      configs: [makeConfig({ asset: ASSET, share: SVETBTC })],
      peggedAddress: VETBTC,
    })

    const result = await fetchHemiEarnShares(queryClient)

    expect(result).toHaveLength(1)
    expect(result[0].shareAddress).toBe(SVETBTC)
    expect(result[0].stakingVault).toBe(REMOTE_SHARE)
    expect(result[0].peggedToken.symbol).toBe('vetBTC')
    expect(result[0].shareToken.symbol).toBe('svetBTC')
    expect(result[0].assets).toHaveLength(1)
    expect(result[0].assets[0].token.symbol).toBe('hemiBTC')
  })

  it('collapses a multi-asset share into a single skeleton carrying every asset', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      configs: [
        makeConfig({ asset: ASSET, share: SVETBTC }),
        makeConfig({ asset: ASSET_2, share: SVETBTC }),
      ],
      peggedAddress: VETBTC,
    })

    const result = await fetchHemiEarnShares(queryClient)

    expect(result).toHaveLength(1)
    expect(result[0].shareAddress).toBe(SVETBTC)
    expect(result[0].assets.map(asset => asset.token.symbol)).toEqual([
      'hemiBTC',
      'enzoBTC',
    ])
  })

  it('skips a share whose pegged token cannot be resolved', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      configs: [makeConfig({ asset: ASSET, share: SVETBTC })],
      peggedAddress: UNKNOWN_ADDRESS,
    })

    const result = await fetchHemiEarnShares(queryClient)
    expect(result).toEqual([])
  })

  it('skips a share with no resolvable deposit assets', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      configs: [makeConfig({ asset: UNKNOWN_ADDRESS, share: SVETBTC })],
      peggedAddress: VETBTC,
    })

    const result = await fetchHemiEarnShares(queryClient)
    expect(result).toEqual([])
  })

  it('returns an empty array when no shares are registered', async function () {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(hemiEarnAssetConfigsQueryOptions().queryKey, [])
    const result = await fetchHemiEarnShares(queryClient)
    expect(result).toEqual([])
  })
})
