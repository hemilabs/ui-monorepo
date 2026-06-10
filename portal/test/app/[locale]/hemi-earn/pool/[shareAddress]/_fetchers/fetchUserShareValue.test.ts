import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'
import { convertToAssets } from 'viem-erc4626/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUserShareValue } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_fetchers/fetchUserShareValue'

vi.mock('viem-erc20/actions', () => ({
  balanceOf: vi.fn(),
}))

vi.mock('viem-erc4626/actions', () => ({
  convertToAssets: vi.fn(),
}))

const account = '0x3333333333333333333333333333333333333333' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address

vi.mock('hemi-earn-actions', () => ({
  getStakingVaultForShare: () => '0xStakingVault',
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
  getPublicClient: () => ({ chain: 'hemi' }),
}))

describe('fetchUserShareValue', function () {
  beforeEach(function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(1000))
    vi.mocked(convertToAssets).mockResolvedValue(BigInt(1500))
  })

  it('chains balanceOf with convertToAssets and returns both', async function () {
    const result = await fetchUserShareValue({ account, shareAddress })

    expect(result).toEqual({
      peggedAmount: BigInt(1500),
      shares: BigInt(1000),
    })
    expect(balanceOf).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ account, address: shareAddress }),
    )
    expect(convertToAssets).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ shares: BigInt(1000) }),
    )
  })

  it('returns zeros and skips RPC when account is undefined', async function () {
    const result = await fetchUserShareValue({
      account: undefined,
      shareAddress,
    })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(balanceOf).not.toHaveBeenCalled()
    expect(convertToAssets).not.toHaveBeenCalled()
  })

  it('returns zeros and skips convertToAssets when shares = 0n', async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(0))

    const result = await fetchUserShareValue({ account, shareAddress })

    expect(result).toEqual({ peggedAmount: BigInt(0), shares: BigInt(0) })
    expect(convertToAssets).not.toHaveBeenCalled()
  })

  it('propagates errors from the share balance read', async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error('RPC down'))

    await expect(
      fetchUserShareValue({ account, shareAddress }),
    ).rejects.toThrow('RPC down')
  })
})
