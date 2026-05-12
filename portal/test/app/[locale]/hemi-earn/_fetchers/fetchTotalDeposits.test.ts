import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { type Address, type PublicClient } from 'viem'
import { describe, expect, it } from 'vitest'

import { fetchTotalDeposits } from '../../../../../app/[locale]/hemi-earn/_fetchers/fetchTotalDeposits'

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
  it('returns placeholder amounts (zero) for each vault token', async function () {
    const result = await fetchTotalDeposits({
      client,
      vaultTokens: [
        { token: tokenA, vaultAddress: vaultA },
        { token: tokenB, vaultAddress: vaultB },
      ],
    })

    expect(result).toEqual([
      { amount: BigInt(0), token: tokenA, vaultAddress: vaultA },
      { amount: BigInt(0), token: tokenB, vaultAddress: vaultB },
    ])
  })

  it('returns empty array for empty vault tokens', async function () {
    const result = await fetchTotalDeposits({
      client,
      vaultTokens: [],
    })

    expect(result).toEqual([])
  })
})
