import { type QueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchDepositShares } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchDepositShares'

vi.mock('viem-erc4626/actions', () => ({
  convertToShares: vi.fn(),
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const stakingVault = '0x3333333333333333333333333333333333333333' as Address

// `fetchDepositShares` resolves the staking vault via
// `ensureQueryData(shareConfigQueryOptions(...))`, so the fake client returns
// a config carrying `remoteShare`.
const buildQueryClient = (
  fetchQuery: (...args: unknown[]) => unknown,
): QueryClient =>
  ({
    ensureQueryData: vi.fn().mockResolvedValue({
      asset,
      remoteShare: stakingVault,
      share: shareAddress,
    }),
    fetchQuery,
  }) as unknown as QueryClient

describe('fetchDepositShares', function () {
  beforeEach(function () {
    vi.mocked(convertToShares).mockResolvedValue(BigInt(42))
  })

  it('chains the quote fetch via fetchQuery and returns shares', async function () {
    const fetchQuery = vi.fn().mockResolvedValue({
      callbackFee: BigInt(1),
      nativeFee: BigInt(2),
      peggedAmount: BigInt(100),
    })
    const queryClient = buildQueryClient(fetchQuery)

    const shares = await fetchDepositShares(queryClient, {
      amount: BigInt(1000),
      asset,
      shareAddress,
    })

    expect(shares).toBe(BigInt(42))
    expect(fetchQuery).toHaveBeenCalledTimes(1)
    expect(convertToShares).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ address: stakingVault, assets: BigInt(100) }),
    )
  })

  it('short-circuits to 0n when the gateway returns peggedAmount=0n', async function () {
    const fetchQuery = vi.fn().mockResolvedValue({
      callbackFee: BigInt(1),
      nativeFee: BigInt(2),
      peggedAmount: BigInt(0),
    })
    const queryClient = buildQueryClient(fetchQuery)

    const shares = await fetchDepositShares(queryClient, {
      amount: BigInt(1000),
      asset,
      shareAddress,
    })

    expect(shares).toBe(BigInt(0))
    expect(convertToShares).not.toHaveBeenCalled()
  })

  it('propagates errors from the underlying quote fetch', async function () {
    const fetchQuery = vi.fn().mockRejectedValue(new Error('Quote failed'))
    const queryClient = buildQueryClient(fetchQuery)

    await expect(
      fetchDepositShares(queryClient, {
        amount: BigInt(1000),
        asset,
        shareAddress,
      }),
    ).rejects.toThrow('Quote failed')
  })
})
