import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { type Address, type PublicClient, zeroAddress } from 'viem'
import { asset } from 'viem-erc4626/actions'
import { describe, expect, it, vi } from 'vitest'

import { fetchHemiEarnTokens } from '../../../../../app/[locale]/hemi-earn/_fetchers/fetchHemiEarnTokens'

vi.mock('viem-erc4626/actions', () => ({
  asset: vi.fn(),
}))

vi.mock('hemi-earn-actions', () => ({
  getEarnVaultAddresses: vi.fn(),
}))

const chainId = hemi.id
const client = {} as PublicClient

const vaultA = '0xaaaa000000000000000000000000000000000001' as Address
const vaultB = '0xaaaa000000000000000000000000000000000002' as Address

const tokenAddressA = '0xbbbb000000000000000000000000000000000001' as Address
const tokenAddressB = '0xbbbb000000000000000000000000000000000002' as Address

describe('fetchHemiEarnTokens', function () {
  it('returns vault-asset pairs for each deployed vault', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, vaultB])
    vi.mocked(asset)
      .mockResolvedValueOnce(tokenAddressA)
      .mockResolvedValueOnce(tokenAddressB)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([
      { chainId, tokenAddress: tokenAddressA, vaultAddress: vaultA },
      { chainId, tokenAddress: tokenAddressB, vaultAddress: vaultB },
    ])
    expect(asset).toHaveBeenCalledTimes(2)
    expect(asset).toHaveBeenCalledWith(client, { address: vaultA })
    expect(asset).toHaveBeenCalledWith(client, { address: vaultB })
  })

  it('skips zero-address vaults', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, zeroAddress])
    vi.mocked(asset).mockResolvedValueOnce(tokenAddressA)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([
      { chainId, tokenAddress: tokenAddressA, vaultAddress: vaultA },
    ])
    expect(asset).toHaveBeenCalledTimes(1)
    expect(asset).toHaveBeenCalledWith(client, { address: vaultA })
  })

  it('preserves correct vault-asset pairing with interleaved zero addresses', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([
      zeroAddress,
      vaultA,
      zeroAddress,
      vaultB,
    ])
    vi.mocked(asset)
      .mockResolvedValueOnce(tokenAddressA)
      .mockResolvedValueOnce(tokenAddressB)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([
      { chainId, tokenAddress: tokenAddressA, vaultAddress: vaultA },
      { chainId, tokenAddress: tokenAddressB, vaultAddress: vaultB },
    ])
    expect(asset).toHaveBeenCalledTimes(2)
    expect(asset).toHaveBeenNthCalledWith(1, client, { address: vaultA })
    expect(asset).toHaveBeenNthCalledWith(2, client, { address: vaultB })
  })

  it('returns an empty array when all vaults are zero addresses', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([zeroAddress, zeroAddress])

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([])
    expect(asset).not.toHaveBeenCalled()
  })
})
