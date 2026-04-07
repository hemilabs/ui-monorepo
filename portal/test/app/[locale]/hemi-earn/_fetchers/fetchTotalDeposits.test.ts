import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { type Address, type PublicClient, zeroAddress } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'
import { describe, expect, it, vi } from 'vitest'

import { fetchTotalDeposits } from '../../../../../app/[locale]/hemi-earn/_fetchers/fetchTotalDeposits'

vi.mock('viem-erc4626/actions', () => ({
  totalAssets: vi.fn(),
}))

vi.mock('hemi-earn-actions', () => ({
  getEarnVaultAddresses: vi.fn(),
}))

const chainId = hemi.id
const client = {} as PublicClient

const vaultA = '0xaaaa000000000000000000000000000000000001' as Address
const vaultB = '0xaaaa000000000000000000000000000000000002' as Address

const tokenA: EvmToken = {
  address: '0xbbbb000000000000000000000000000000000001',
  chainId,
  decimals: 18,
  logoURI: '',
  name: 'Token A',
  symbol: 'TKA',
}

const tokenB: EvmToken = {
  address: '0xbbbb000000000000000000000000000000000002',
  chainId,
  decimals: 8,
  logoURI: '',
  name: 'Token B',
  symbol: 'TKB',
}

describe('fetchTotalDeposits', function () {
  it('returns deposit amounts per vault', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, vaultB])
    vi.mocked(totalAssets)
      .mockResolvedValueOnce(BigInt(1000))
      .mockResolvedValueOnce(BigInt(2000))

    const result = await fetchTotalDeposits({
      chainId,
      client,
      tokens: [tokenA, tokenB],
    })

    expect(result).toEqual([
      { amount: BigInt(1000), token: tokenA },
      { amount: BigInt(2000), token: tokenB },
    ])
    expect(totalAssets).toHaveBeenCalledTimes(2)
    expect(totalAssets).toHaveBeenCalledWith(client, { address: vaultA })
    expect(totalAssets).toHaveBeenCalledWith(client, { address: vaultB })
  })

  it('returns zero for zero-address vaults', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([vaultA, zeroAddress])
    vi.mocked(totalAssets).mockResolvedValueOnce(BigInt(500))

    const result = await fetchTotalDeposits({
      chainId,
      client,
      tokens: [tokenA, tokenB],
    })

    expect(result).toEqual([
      { amount: BigInt(500), token: tokenA },
      { amount: BigInt(0), token: tokenB },
    ])
    expect(totalAssets).toHaveBeenCalledTimes(1)
  })

  it('returns empty array for empty tokens', async function () {
    vi.mocked(getEarnVaultAddresses).mockReturnValue([])

    const result = await fetchTotalDeposits({
      chainId,
      client,
      tokens: [],
    })

    expect(result).toEqual([])
    expect(totalAssets).not.toHaveBeenCalled()
  })
})
