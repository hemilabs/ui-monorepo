import { previewDeposit } from '@vetro-protocol/gateway/actions'
import {
  getAssetData,
  quoteDeposit,
  quoteDepositFulfillment,
} from 'hemi-earn-actions/actions'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchQuoteDeposit } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchQuoteDeposit'

vi.mock('hemi-earn-actions/actions', () => ({
  getAssetData: vi.fn(),
  quoteDeposit: vi.fn(),
  quoteDepositFulfillment: vi.fn(),
}))

vi.mock('@vetro-protocol/gateway/actions', () => ({
  previewDeposit: vi.fn(),
}))

vi.mock('hemi-earn-actions', () => ({
  getGatewayForShare: () => '0xGateway',
  getHemiEarnAgentAddress: () => '0xAgent',
  getHemiEarnRouterAddress: () => '0xRouter',
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
  getPublicClient: () => ({ chain: 'hemi' }),
}))

const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const remoteAsset = '0x3333333333333333333333333333333333333333' as Address

describe('fetchQuoteDeposit', function () {
  beforeEach(function () {
    vi.mocked(getAssetData).mockResolvedValue({
      enabled: true,
      remoteAsset,
      remoteShare: '0x4444444444444444444444444444444444444444',
      share: '0x5555555555555555555555555555555555555555',
    })
    vi.mocked(quoteDepositFulfillment).mockResolvedValue(BigInt(11))
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(22))
    vi.mocked(previewDeposit).mockResolvedValue(BigInt(33))
  })

  it('returns callbackFee, nativeFee and peggedAmount', async function () {
    const result = await fetchQuoteDeposit({
      amount: BigInt(1000),
      asset,
      shareAddress,
    })

    expect(result).toEqual({
      callbackFee: BigInt(11),
      nativeFee: BigInt(22),
      peggedAmount: BigInt(33),
    })
  })

  it('threads the resolved remoteAsset through previewDeposit', async function () {
    await fetchQuoteDeposit({ amount: BigInt(1000), asset, shareAddress })

    expect(previewDeposit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amountIn: BigInt(1000), tokenIn: remoteAsset }),
    )
  })

  it('threads the resolved callbackFee through quoteDeposit', async function () {
    vi.mocked(quoteDepositFulfillment).mockResolvedValue(BigInt(99))

    await fetchQuoteDeposit({ amount: BigInt(1000), asset, shareAddress })

    expect(quoteDeposit).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: BigInt(1000),
        callbackFee: BigInt(99),
      }),
    )
  })

  it('propagates errors from the upstream reads', async function () {
    vi.mocked(quoteDepositFulfillment).mockRejectedValue(new Error('RPC down'))

    await expect(
      fetchQuoteDeposit({ amount: BigInt(1000), asset, shareAddress }),
    ).rejects.toThrow('RPC down')
  })
})
