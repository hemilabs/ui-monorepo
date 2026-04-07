import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { getTokenByAddress } from 'utils/token'
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

vi.mock('utils/token', async () => ({
  ...(await vi.importActual<typeof import('utils/token')>('utils/token')),
  getTokenByAddress: vi.fn(),
}))

const chainId = hemi.id
const client = {} as PublicClient

const vaultA = '0xaaaa000000000000000000000000000000000001' as Address
const vaultB = '0xaaaa000000000000000000000000000000000002' as Address

const tokenAddressA = '0xbbbb000000000000000000000000000000000001' as Address
const tokenAddressB = '0xbbbb000000000000000000000000000000000002' as Address

const tokenA: EvmToken = {
  address: tokenAddressA,
  chainId,
  decimals: 18,
  logoURI: '',
  name: 'Token A',
  symbol: 'TKA',
}

const tokenB: EvmToken = {
  address: tokenAddressB,
  chainId,
  decimals: 8,
  logoURI: '',
  name: 'Token B',
  symbol: 'TKB',
}

describe('fetchHemiEarnTokens', function () {
  it('returns vault-token pairs for each deployed vault', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, vaultB])
    vi.mocked(asset)
      .mockResolvedValueOnce(tokenAddressA)
      .mockResolvedValueOnce(tokenAddressB)
    vi.mocked(getTokenByAddress)
      .mockReturnValueOnce(tokenA)
      .mockReturnValueOnce(tokenB)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([
      { token: tokenA, vaultAddress: vaultA },
      { token: tokenB, vaultAddress: vaultB },
    ])
    expect(asset).toHaveBeenCalledTimes(2)
    expect(asset).toHaveBeenCalledWith(client, { address: vaultA })
    expect(asset).toHaveBeenCalledWith(client, { address: vaultB })
  })

  it('skips zero-address vaults', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, zeroAddress])
    vi.mocked(asset).mockResolvedValueOnce(tokenAddressA)
    vi.mocked(getTokenByAddress).mockReturnValueOnce(tokenA)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([{ token: tokenA, vaultAddress: vaultA }])
    expect(asset).toHaveBeenCalledTimes(1)
    expect(asset).toHaveBeenCalledWith(client, { address: vaultA })
  })

  it('preserves correct vault-token pairing with interleaved zero addresses', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([
      zeroAddress,
      vaultA,
      zeroAddress,
      vaultB,
    ])
    vi.mocked(asset)
      .mockResolvedValueOnce(tokenAddressA)
      .mockResolvedValueOnce(tokenAddressB)
    vi.mocked(getTokenByAddress)
      .mockReturnValueOnce(tokenA)
      .mockReturnValueOnce(tokenB)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([
      { token: tokenA, vaultAddress: vaultA },
      { token: tokenB, vaultAddress: vaultB },
    ])
    expect(asset).toHaveBeenCalledTimes(2)
    expect(asset).toHaveBeenNthCalledWith(1, client, { address: vaultA })
    expect(asset).toHaveBeenNthCalledWith(2, client, { address: vaultB })
  })

  it('filters out addresses not found in the token list', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, vaultB])
    vi.mocked(asset)
      .mockResolvedValueOnce(tokenAddressA)
      .mockResolvedValueOnce(tokenAddressB)
    vi.mocked(getTokenByAddress)
      .mockReturnValueOnce(tokenA)
      .mockReturnValueOnce(undefined)

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([{ token: tokenA, vaultAddress: vaultA }])
  })

  it('returns an empty array when all vaults are zero addresses', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([zeroAddress, zeroAddress])

    const result = await fetchHemiEarnTokens({ chainId, client })

    expect(result).toEqual([])
    expect(asset).not.toHaveBeenCalled()
  })
})
