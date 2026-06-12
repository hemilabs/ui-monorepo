import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUserShareValue } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchUserShareValue'

vi.mock('viem-erc20/actions', () => ({
  balanceOf: vi.fn(),
}))

const account = '0x3333333333333333333333333333333333333333' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address

vi.mock('utils/chainClients', () => ({
  getPublicClient: () => ({ chain: 'hemi' }),
}))

vi.mock(
  '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchSharesToPegged',
  () => ({
    sharesToPeggedOptions: () => ({
      queryKey: ['hemi-earn', 'shares-to-pegged'],
    }),
  }),
)

const createQueryClient = (peggedAmount: bigint) => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'shares-to-pegged':
        return Promise.resolve({ peggedAmount })
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
})

describe('fetchUserShareValue', function () {
  beforeEach(function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(1000))
  })

  it('reads share balance and resolves peggedAmount via sharesToPegged cache', async function () {
    const queryClient = createQueryClient(BigInt(1500))
    const result = await fetchUserShareValue({
      account,
      queryClient: queryClient as never,
      shareAddress,
    })

    expect(result).toEqual({
      peggedAmount: BigInt(1500),
      shares: BigInt(1000),
    })
    expect(balanceOf).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ account, address: shareAddress }),
    )
    expect(queryClient.ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['shares-to-pegged']),
      }),
    )
  })

  it('returns zeros and skips RPC when account is undefined', async function () {
    const queryClient = createQueryClient(BigInt(0))
    const result = await fetchUserShareValue({
      account: undefined,
      queryClient: queryClient as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(balanceOf).not.toHaveBeenCalled()
    expect(queryClient.ensureQueryData).not.toHaveBeenCalled()
  })

  it('returns zeros and skips sharesToPegged when shares = 0n', async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(0))
    const queryClient = createQueryClient(BigInt(0))

    const result = await fetchUserShareValue({
      account,
      queryClient: queryClient as never,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(queryClient.ensureQueryData).not.toHaveBeenCalled()
  })

  it('propagates errors from the share balance read', async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error('RPC down'))
    const queryClient = createQueryClient(BigInt(0))

    await expect(
      fetchUserShareValue({
        account,
        queryClient: queryClient as never,
        shareAddress,
      }),
    ).rejects.toThrow('RPC down')
  })
})
