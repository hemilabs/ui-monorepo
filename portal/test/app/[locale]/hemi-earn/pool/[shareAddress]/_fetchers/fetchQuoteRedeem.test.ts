import {
  getAssetData,
  quoteRedeem,
  quoteRedeemFulfillment,
  resolveIsInstant,
} from 'hemi-earn-actions/actions'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchQuoteRedeem } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchQuoteRedeem'

vi.mock('hemi-earn-actions/actions', () => ({
  getAgentAddress: vi.fn(),
  getAssetData: vi.fn(),
  quoteRedeem: vi.fn(),
  quoteRedeemFulfillment: vi.fn(),
  resolveIsInstant: vi.fn(),
}))

vi.mock('hemi-earn-actions', () => ({
  getHemiEarnRouterAddress: () => '0xRouter',
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
  getPublicClient: () => ({ chain: 'hemi' }),
}))

const account = '0x9999999999999999999999999999999999999999' as Address
const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const remoteAsset = '0x3333333333333333333333333333333333333333' as Address

// Fake query client that resolves the agent-address lookup the fetcher threads
// through the cache, branching on the query's key.
const createQueryClient = () => ({
  ensureQueryData: vi.fn(function ({ queryKey }) {
    switch (queryKey[1]) {
      case 'agent-address':
        return Promise.resolve('0xAgent')
      default:
        return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
    }
  }),
})

describe('fetchQuoteRedeem', function () {
  beforeEach(function () {
    vi.mocked(resolveIsInstant).mockResolvedValue(false)
    vi.mocked(getAssetData).mockResolvedValue({
      enabled: true,
      remoteAsset,
      remoteShare: '0x4444444444444444444444444444444444444444',
      share: '0x5555555555555555555555555555555555555555',
    })
    vi.mocked(quoteRedeemFulfillment).mockResolvedValue(BigInt(11))
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(22))
  })

  it('returns callbackFee, isInstant and nativeFee', async function () {
    const result = await fetchQuoteRedeem({
      account,
      asset,
      queryClient: createQueryClient() as never,
      shareAddress,
      shares: BigInt(500),
    })

    expect(result).toEqual({
      callbackFee: BigInt(11),
      isInstant: false,
      nativeFee: BigInt(22),
    })
  })

  it('threads the resolved remoteAsset through quoteRedeemFulfillment', async function () {
    await fetchQuoteRedeem({
      account,
      asset,
      queryClient: createQueryClient() as never,
      shareAddress,
      shares: BigInt(500),
    })

    expect(quoteRedeemFulfillment).toHaveBeenCalledWith(
      expect.objectContaining({ agentAddress: '0xAgent', asset: remoteAsset }),
    )
  })

  it('threads the resolved isInstant + callbackFee into Router.quoteRedeem', async function () {
    vi.mocked(resolveIsInstant).mockResolvedValue(true)
    vi.mocked(quoteRedeemFulfillment).mockResolvedValue(BigInt(99))

    await fetchQuoteRedeem({
      account,
      asset,
      queryClient: createQueryClient() as never,
      shareAddress,
      shares: BigInt(500),
    })

    expect(quoteRedeem).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackFee: BigInt(99),
        isInstant: true,
        shares: BigInt(500),
      }),
    )
  })

  it('propagates errors from the upstream reads', async function () {
    vi.mocked(resolveIsInstant).mockRejectedValue(
      new Error('Vault unreachable'),
    )

    await expect(
      fetchQuoteRedeem({
        account,
        asset,
        queryClient: createQueryClient() as never,
        shareAddress,
        shares: BigInt(500),
      }),
    ).rejects.toThrow('Vault unreachable')
  })
})
