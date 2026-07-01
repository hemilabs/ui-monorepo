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
const remoteAsset = '0x7777777777777777777777777777777777777777' as Address
const remoteShare = '0x8888888888888888888888888888888888888888' as Address

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

const createQueryClient = () => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'asset-data':
        return Promise.resolve({ remoteAsset, remoteShare })
      case 'gateway-for-share':
        return Promise.resolve(gateway)
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
})

describe('fetchAssetsToShares', function () {
  beforeEach(function () {
    vi.mocked(previewWithdraw).mockResolvedValue(BigInt(200))
    vi.mocked(convertToShares).mockResolvedValue(BigInt(1000))
  })

  it('composes previewWithdraw with convertToShares', async function () {
    const queryClient = createQueryClient()

    const result = await fetchAssetsToShares({
      amount: BigInt(42),
      assetAddress,
      queryClient: queryClient as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(200), shares: BigInt(1000) })
    expect(previewWithdraw).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: gateway,
        amountOut: BigInt(42),
        tokenOut: remoteAsset,
      }),
    )
    expect(convertToShares).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: remoteShare,
        assets: BigInt(200),
      }),
    )
  })

  it('returns zeros and skips convertToShares when peggedAmount is 0n', async function () {
    vi.mocked(previewWithdraw).mockResolvedValue(BigInt(0))
    const queryClient = createQueryClient()

    const result = await fetchAssetsToShares({
      amount: BigInt(42),
      assetAddress,
      queryClient: queryClient as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(convertToShares).not.toHaveBeenCalled()
  })

  it('propagates errors from previewWithdraw', async function () {
    vi.mocked(previewWithdraw).mockRejectedValue(new Error('Gateway down'))
    const queryClient = createQueryClient()

    await expect(
      fetchAssetsToShares({
        amount: BigInt(42),
        assetAddress,
        queryClient: queryClient as never,
        shareAddress,
      }),
    ).rejects.toThrow('Gateway down')
  })
})
