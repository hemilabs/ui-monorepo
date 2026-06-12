import { fetchEarnPositions } from 'app/[locale]/hemi-earn/_fetchers/fetchEarnPositions'
import {
  hemiEarnSharesQueryOptions,
  type ShareSkeleton,
} from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnShares'
import { hemi } from 'hemi-viem'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under vitest)
// through the chainClients → transport import chain.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getPublicClient: vi.fn(),
}))

// `fetchEarnPositions` calls `queryClient.fetchQuery(shareBalanceQueryOptions)`
// which always invokes `queryFn` when the cached entry is stale (default
// `staleTime: 0`). Seeding via `setQueryData` is therefore not enough — we
// also need the queryFn (`balanceOf` from `viem-erc20/actions`) to resolve.
vi.mock('viem-erc20/actions', () => ({
  balanceOf: vi.fn(),
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
  stakingVault: shareAddress,
})

const seedShares = (
  queryClient: ReturnType<typeof createTestQueryClient>,
  shares: ShareSkeleton[],
) => queryClient.setQueryData(hemiEarnSharesQueryOptions().queryKey, shares)

// Resolves `balanceOf` per shareAddress using the second argument's `address`.
// Lets each test express "for share X return Y" without re-mocking the
// implementation each time.
const mockBalances = (balances: Record<Address, bigint | Error>) =>
  vi.mocked(balanceOf).mockImplementation(async function (
    _client,
    { address },
  ) {
    const result = balances[address as Address]
    if (result === undefined) {
      throw new Error(`unexpected balanceOf call for ${address}`)
    }
    if (result instanceof Error) {
      throw result
    }
    return result
  })

describe('app/[locale]/hemi-earn/_fetchers/fetchEarnPositions', function () {
  beforeEach(function () {
    vi.mocked(balanceOf).mockReset()
  })

  it('returns one position per non-zero balance', async function () {
    const queryClient = createTestQueryClient()
    seedShares(queryClient, [
      skeleton(shareAddrA, shareTokenA, peggedTokenA),
      skeleton(shareAddrB, shareTokenB, peggedTokenB),
    ])
    mockBalances({
      [shareAddrA]: 5n * 10n ** 18n,
      [shareAddrB]: 7n * 10n ** 18n,
    })

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
    mockBalances({
      [shareAddrA]: 0n,
      [shareAddrB]: 3n * 10n ** 18n,
    })

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
    mockBalances({
      [shareAddrA]: 4n * 10n ** 18n,
      [shareAddrB]: new Error('rpc down'),
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
    mockBalances({
      [shareAddrA]: new Error('rpc down'),
      [shareAddrB]: new Error('rpc down'),
    })

    await expect(
      fetchEarnPositions({ account, networkType, queryClient }),
    ).rejects.toThrow('All share balance reads failed')
  })
})
