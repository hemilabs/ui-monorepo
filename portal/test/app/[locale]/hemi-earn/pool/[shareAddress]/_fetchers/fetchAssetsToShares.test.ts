import { previewWithdraw } from '@vetro-protocol/gateway/actions'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchAssetsToShares } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchAssetsToShares'

vi.mock('@vetro-protocol/gateway/actions', () => ({
  previewWithdraw: vi.fn(),
}))

vi.mock('viem-erc4626/actions', () => ({
  convertToShares: vi.fn(),
}))

const assetAddress = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const gateway = '0x6666666666666666666666666666666666666666' as Address

vi.mock('hemi-earn-actions', () => ({
  getHemiEarnSupportedAssets: () => [
    { asset: assetAddress, share: shareAddress },
  ],
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

// Fake query client that resolves the gateway the fetcher maps from the
// share's asset through the cache, branching on the query's key.
const createQueryClient = () => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'gateway-for-asset':
        return Promise.resolve(gateway)
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
})

describe('fetchAssetsToShares', function () {
  beforeEach(function () {
    vi.mocked(previewWithdraw).mockResolvedValue(BigInt(200))
    vi.mocked(convertToShares).mockResolvedValue(BigInt(42))
  })

  it('chains previewWithdraw with convertToShares and returns both', async function () {
    const result = await fetchAssetsToShares({
      amount: BigInt(1000),
      assetAddress,
      queryClient: createQueryClient() as never,
      shareAddress,
    })

    expect(result).toEqual({
      peggedAmount: BigInt(200),
      shares: BigInt(42),
    })
    expect(previewWithdraw).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: gateway,
        amountOut: BigInt(1000),
        tokenOut: assetAddress,
      }),
    )
    expect(convertToShares).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ assets: BigInt(200) }),
    )
  })

  it('returns zeros when the gateway returns peggedAmount=0n', async function () {
    vi.mocked(previewWithdraw).mockResolvedValue(BigInt(0))

    const result = await fetchAssetsToShares({
      amount: BigInt(1000),
      assetAddress,
      queryClient: createQueryClient() as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(convertToShares).not.toHaveBeenCalled()
  })

  it('returns zeros when previewWithdraw returns a negative amount', async function () {
    vi.mocked(previewWithdraw).mockResolvedValue(BigInt(-1))

    const result = await fetchAssetsToShares({
      amount: BigInt(1000),
      assetAddress,
      queryClient: createQueryClient() as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(convertToShares).not.toHaveBeenCalled()
  })

  it('propagates errors from the gateway read', async function () {
    vi.mocked(previewWithdraw).mockRejectedValue(new Error('Gateway down'))

    await expect(
      fetchAssetsToShares({
        amount: BigInt(1000),
        assetAddress,
        queryClient: createQueryClient() as never,
        shareAddress,
      }),
    ).rejects.toThrow('Gateway down')
  })
})
