import { type QueryClient } from '@tanstack/react-query'
import { getMintFee, getRedeemFee } from '@vetro-protocol/gateway/actions'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { fetchVetroFee } from '../../../../../../../app/[locale]/hemi-earn/vault/[shareAddress]/_fetchers/fetchVetroFee'

vi.mock('@vetro-protocol/gateway/actions', () => ({
  getMintFee: vi.fn(),
  getRedeemFee: vi.fn(),
}))

vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: () => ({ chain: 'mainnet' }),
}))

const asset = '0x1111111111111111111111111111111111111111' as Address
const shareAddress = '0x2222222222222222222222222222222222222222' as Address
const remoteAsset = '0x3333333333333333333333333333333333333333' as Address
const gateway = '0x6666666666666666666666666666666666666666' as Address

const createQueryClient = (): QueryClient =>
  ({
    ensureQueryData: vi.fn(function ({ queryKey }) {
      switch (queryKey[1]) {
        case 'asset-data':
          return Promise.resolve({ remoteAsset })
        case 'gateway-for-share':
          return Promise.resolve(gateway)
        default:
          return Promise.reject(new Error(`unexpected query ${queryKey[1]}`))
      }
    }),
  }) as unknown as QueryClient

describe('fetchVetroFee', function () {
  it('reads the mint fee when depositing', async function () {
    vi.mocked(getMintFee).mockResolvedValue(BigInt(7))
    const queryClient = createQueryClient()

    const fee = await fetchVetroFee(queryClient, {
      asset,
      operation: 'deposit',
      shareAddress,
    })

    expect(fee).toBe(0.07)
    expect(getRedeemFee).not.toHaveBeenCalled()
    expect(getMintFee).toHaveBeenCalledWith(
      { chain: 'mainnet' },
      { address: gateway, token: remoteAsset },
    )
  })

  it('reads the redeem fee when withdrawing', async function () {
    vi.mocked(getRedeemFee).mockResolvedValue(BigInt(15))
    const queryClient = createQueryClient()

    const fee = await fetchVetroFee(queryClient, {
      asset,
      operation: 'withdraw',
      shareAddress,
    })

    expect(fee).toBe(0.15)
    expect(getMintFee).not.toHaveBeenCalled()
    expect(getRedeemFee).toHaveBeenCalledWith(
      { chain: 'mainnet' },
      { address: gateway, token: remoteAsset },
    )
  })

  it('reports a free operation as zero rather than as missing', async function () {
    vi.mocked(getMintFee).mockResolvedValue(BigInt(0))

    const fee = await fetchVetroFee(createQueryClient(), {
      asset,
      operation: 'deposit',
      shareAddress,
    })

    expect(fee).toBe(0)
  })
})
