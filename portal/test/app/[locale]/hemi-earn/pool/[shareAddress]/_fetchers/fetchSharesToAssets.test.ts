import { previewRedeem } from '@vetro-protocol/gateway/actions'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchSharesToAssets } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchSharesToAssets'

vi.mock('@vetro-protocol/gateway/actions', () => ({
  previewRedeem: vi.fn(),
}))

const assetAddress = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const gateway = '0x6666666666666666666666666666666666666666' as Address
const remoteAsset = '0x7777777777777777777777777777777777777777' as Address

vi.mock('hemi-earn-actions', () => ({
  getHemiEarnSupportedAssets: () => [
    { asset: assetAddress, share: shareAddress },
  ],
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

const createQueryClient = (peggedAmount: bigint) => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'asset-data':
        return Promise.resolve({ remoteAsset })
      case 'gateway-for-asset':
        return Promise.resolve(gateway)
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
  fetchQuery: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'shares-to-pegged':
        return Promise.resolve({ peggedAmount })
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
})

describe('fetchSharesToAssets', function () {
  beforeEach(function () {
    vi.mocked(previewRedeem).mockResolvedValue(BigInt(42))
  })

  it('composes the shares→pegged step with previewRedeem', async function () {
    const queryClient = createQueryClient(BigInt(200))

    const result = await fetchSharesToAssets({
      assetAddress,
      queryClient: queryClient as never,
      shareAddress,
      shares: BigInt(1000),
    })

    expect(result).toEqual({
      assetOut: BigInt(42),
      peggedAmount: BigInt(200),
    })
    expect(queryClient.fetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['shares-to-pegged']),
      }),
    )
    expect(previewRedeem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: gateway,
        peggedTokenIn: BigInt(200),
        tokenOut: remoteAsset,
      }),
    )
  })

  it('returns zeros and skips previewRedeem when peggedAmount is 0n', async function () {
    const queryClient = createQueryClient(BigInt(0))

    const result = await fetchSharesToAssets({
      assetAddress,
      queryClient: queryClient as never,
      shareAddress,
      shares: BigInt(1000),
    })

    expect(result).toEqual({ assetOut: BigInt(0), peggedAmount: BigInt(0) })
    expect(previewRedeem).not.toHaveBeenCalled()
  })

  it('propagates errors from previewRedeem', async function () {
    vi.mocked(previewRedeem).mockRejectedValue(new Error('Gateway down'))
    const queryClient = createQueryClient(BigInt(200))

    await expect(
      fetchSharesToAssets({
        assetAddress,
        queryClient: queryClient as never,
        shareAddress,
        shares: BigInt(1000),
      }),
    ).rejects.toThrow('Gateway down')
  })
})
