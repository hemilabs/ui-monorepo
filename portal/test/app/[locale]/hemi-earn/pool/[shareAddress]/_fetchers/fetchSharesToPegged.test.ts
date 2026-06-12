import { type Address } from 'viem'
import { convertToAssets } from 'viem-erc4626/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchSharesToPegged } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchSharesToPegged'

vi.mock('viem-erc4626/actions', () => ({
  convertToAssets: vi.fn(),
}))

const shareAddress = '0x2222222222222222222222222222222222222222' as Address

vi.mock('hemi-earn-actions', () => ({
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

describe('fetchSharesToPegged', function () {
  beforeEach(function () {
    vi.mocked(convertToAssets).mockResolvedValue(BigInt(200))
  })

  it('returns peggedAmount from convertToAssets', async function () {
    const result = await fetchSharesToPegged({
      shareAddress,
      shares: BigInt(1000),
    })

    expect(result).toEqual({ peggedAmount: BigInt(200) })
    expect(convertToAssets).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ shares: BigInt(1000) }),
    )
  })

  it('short-circuits and skips RPC when shares = 0n', async function () {
    const result = await fetchSharesToPegged({
      shareAddress,
      shares: BigInt(0),
    })

    expect(result).toEqual({ peggedAmount: BigInt(0) })
    expect(convertToAssets).not.toHaveBeenCalled()
  })

  it('clamps negative peggedAmount to 0n', async function () {
    vi.mocked(convertToAssets).mockResolvedValue(BigInt(-1))

    const result = await fetchSharesToPegged({
      shareAddress,
      shares: BigInt(1000),
    })

    expect(result).toEqual({ peggedAmount: BigInt(0) })
  })

  it('propagates errors from the vault read', async function () {
    vi.mocked(convertToAssets).mockRejectedValue(new Error('Vault down'))

    await expect(
      fetchSharesToPegged({ shareAddress, shares: BigInt(1000) }),
    ).rejects.toThrow('Vault down')
  })
})
