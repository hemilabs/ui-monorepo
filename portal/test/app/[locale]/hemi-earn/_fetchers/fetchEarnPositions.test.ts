import {
  fetchEarnPositions,
  shareBalanceQueryOptions,
} from 'app/[locale]/hemi-earn/_fetchers/fetchEarnPositions'
import {
  hemiEarnSharesQueryOptions,
  type ShareSkeleton,
} from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares'
import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under vitest)
// through the chainClients → transport import chain. The queryFns that would
// use these clients are never invoked here because the cache is seeded.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getHemiClient: vi.fn(),
}))

const account = '0x000000000000000000000000000000000000abcd' as Address
const networkType = 'testnet'

const shareAddrA = '0x1111111111111111111111111111111111111111' as Address
const shareAddrB = '0x2222222222222222222222222222222222222222' as Address

const peggedTokenA: EvmToken = {
  address: '0xa000000000000000000000000000000000000000',
  chainId: hemi.id,
  decimals: 18,
  logoURI: '',
  name: 'Pegged A',
  symbol: 'PEGA',
}
const peggedTokenB: EvmToken = {
  address: '0xb000000000000000000000000000000000000000',
  chainId: hemi.id,
  decimals: 18,
  logoURI: '',
  name: 'Pegged B',
  symbol: 'PEGB',
}
const shareTokenA: EvmToken = {
  address: shareAddrA,
  chainId: hemi.id,
  decimals: 18,
  logoURI: '',
  name: 'Share A',
  symbol: 'SHA',
}
const shareTokenB: EvmToken = {
  address: shareAddrB,
  chainId: hemi.id,
  decimals: 18,
  logoURI: '',
  name: 'Share B',
  symbol: 'SHB',
}

const skeleton = (
  shareAddress: Address,
  shareToken: EvmToken,
  peggedToken: EvmToken,
): ShareSkeleton => ({
  assets: [{ address: peggedToken.address as Address, token: peggedToken }],
  peggedToken,
  shareAddress,
  shareToken,
})

const seedShares = (
  queryClient: ReturnType<typeof createTestQueryClient>,
  shares: ShareSkeleton[],
) =>
  queryClient.setQueryData(
    hemiEarnSharesQueryOptions({ queryClient }).queryKey,
    shares,
  )

const seedBalance = (
  queryClient: ReturnType<typeof createTestQueryClient>,
  shareAddress: Address,
  balance: bigint,
) =>
  queryClient.setQueryData(
    shareBalanceQueryOptions({ account, networkType, shareAddress }).queryKey,
    balance,
  )

describe('app/[locale]/hemi-earn/_fetchers/fetchEarnPositions', function () {
  it('returns one position per non-zero balance', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [
      skeleton(shareAddrA, shareTokenA, peggedTokenA),
      skeleton(shareAddrB, shareTokenB, peggedTokenB),
    ])
    seedBalance(queryClient, shareAddrA, 5n * 10n ** 18n)
    seedBalance(queryClient, shareAddrB, 7n * 10n ** 18n)

    const result = await fetchEarnPositions({
      account,
      networkType,
      queryClient,
    })

    expect(result).toEqual([
      {
        peggedToken: peggedTokenA,
        shareAddress: shareAddrA,
        shareToken: shareTokenA,
        yourDeposit: 5n * 10n ** 18n,
      },
      {
        peggedToken: peggedTokenB,
        shareAddress: shareAddrB,
        shareToken: shareTokenB,
        yourDeposit: 7n * 10n ** 18n,
      },
    ])
  })

  it('filters out shares with a zero balance', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [
      skeleton(shareAddrA, shareTokenA, peggedTokenA),
      skeleton(shareAddrB, shareTokenB, peggedTokenB),
    ])
    seedBalance(queryClient, shareAddrA, 0n)
    seedBalance(queryClient, shareAddrB, 3n * 10n ** 18n)

    const result = await fetchEarnPositions({
      account,
      networkType,
      queryClient,
    })

    expect(result).toHaveLength(1)
    expect(result[0].shareAddress).toBe(shareAddrB)
  })

  it('returns an empty array when there are no registered shares', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [])

    const result = await fetchEarnPositions({
      account,
      networkType,
      queryClient,
    })

    expect(result).toEqual([])
  })

  it('returns successful reads when some balance queries reject', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [
      skeleton(shareAddrA, shareTokenA, peggedTokenA),
      skeleton(shareAddrB, shareTokenB, peggedTokenB),
    ])
    seedBalance(queryClient, shareAddrA, 4n * 10n ** 18n)
    // shareB intentionally has no seeded data; with no queryFn defined here
    // ensureQueryData rejects, exercising the `allSettled` tolerance path.
    queryClient.setDefaultOptions({
      queries: { queryFn: () => Promise.reject(new Error('rpc down')) },
    })

    const result = await fetchEarnPositions({
      account,
      networkType,
      queryClient,
    })

    expect(result).toHaveLength(1)
    expect(result[0].shareAddress).toBe(shareAddrA)
  })

  it('throws when every balance read rejects', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [
      skeleton(shareAddrA, shareTokenA, peggedTokenA),
      skeleton(shareAddrB, shareTokenB, peggedTokenB),
    ])
    queryClient.setDefaultOptions({
      queries: { queryFn: () => Promise.reject(new Error('rpc down')) },
    })

    await expect(
      fetchEarnPositions({ account, networkType, queryClient }),
    ).rejects.toThrow('All share balance reads failed')
  })
})
