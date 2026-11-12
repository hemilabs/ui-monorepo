import {
  type CompositionData,
  fetchComposition,
  toCompositionItems,
} from 'app/[locale]/hemi-earn/_fetchers/fetchComposition'
import fetch from 'fetch-plus-plus'
import { tokenQueryOptions } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { type Token } from 'types/token'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under vitest)
// through the chainClients → transport import chain. The clients are never
// used because every nested query is seeded.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getPublicClient: vi.fn(),
}))

// The composition endpoint call — the only direct network request of the fetcher.
vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const apiUrl = 'https://vetro.test'
const stakingVault = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address

const tokenA = '0x1111111111111111111111111111111111111111' as Address
const tokenB = '0x2222222222222222222222222222222222222222' as Address

const makeToken = (address: Address, symbol: string): Token => ({
  address,
  chainId: mainnet.id,
  decimals: 6,
  logoURI: '',
  name: symbol,
  symbol,
})

const seedQueryClient = function (tokens: Token[]) {
  const queryClient = createTestQueryClient()
  tokens.forEach(token =>
    queryClient.setQueryData(
      tokenQueryOptions({ address: token.address, chainId: mainnet.id })
        .queryKey,
      token,
    ),
  )
  return queryClient
}

describe('app/[locale]/hemi-earn/_fetchers/fetchComposition', function () {
  describe('fetchComposition', function () {
    it('reads the vault composition and resolves each token symbol', async function () {
      const queryClient = seedQueryClient([
        makeToken(tokenA, 'USDC'),
        makeToken(tokenB, 'USDT'),
      ])
      vi.mocked(fetch).mockResolvedValue({
        items: [
          {
            amount: '700',
            name: 'Strategy A',
            share: 0.7,
            token: tokenA,
            type: 'strategy',
          },
          { amount: '200', share: 0.2, token: tokenB, type: 'reserve' },
          {
            amount: '100',
            name: 'Strategy B',
            share: 0.1,
            token: tokenB,
            type: 'strategy',
          },
        ],
        total: '1000',
      })

      const result = await fetchComposition({
        apiUrl,
        queryClient,
        stakingVault,
      })

      expect(result).toEqual([
        {
          amount: BigInt(700),
          name: 'Strategy A',
          share: 0.7,
          symbol: 'USDC',
          token: tokenA,
          type: 'strategy',
        },
        {
          amount: BigInt(200),
          name: undefined,
          share: 0.2,
          symbol: 'USDT',
          token: tokenB,
          type: 'reserve',
        },
        {
          amount: BigInt(100),
          name: 'Strategy B',
          share: 0.1,
          symbol: 'USDT',
          token: tokenB,
          type: 'strategy',
        },
      ])
      expect(fetch).toHaveBeenCalledWith(
        `${apiUrl}/variable-stake/composition/${stakingVault}`,
      )
    })
  })

  describe('toCompositionItems', function () {
    const reserveBufferLabel = 'Reserve Buffer'
    const data: CompositionData = [
      {
        amount: BigInt(30),
        name: 'Strategy A1',
        share: 0.15,
        symbol: 'USDC',
        token: tokenA,
        type: 'strategy',
      },
      {
        amount: BigInt(80),
        name: 'Strategy A2',
        share: 0.4,
        symbol: 'USDC',
        token: tokenA,
        type: 'strategy',
      },
      {
        amount: BigInt(50),
        name: 'Strategy B1',
        share: 0.25,
        symbol: 'USDT',
        token: tokenB,
        type: 'strategy',
      },
      {
        amount: BigInt(30),
        share: 0.15,
        symbol: 'USDC',
        token: tokenA,
        type: 'reserve',
      },
      {
        amount: BigInt(10),
        share: 0.05,
        symbol: 'USDT',
        token: tokenB,
        type: 'reserve',
      },
    ]

    it('sums amount and share by token', function () {
      const items = toCompositionItems({
        data,
        reserveBufferLabel,
        viewMode: 'token',
      })

      expect(items).toEqual([
        {
          amount: BigInt(140),
          isReserveBuffer: false,
          name: 'USDC',
          share: 0.15 + 0.4 + 0.15,
        },
        {
          amount: BigInt(60),
          isReserveBuffer: false,
          name: 'USDT',
          share: 0.25 + 0.05,
        },
      ])
    })

    it('uses the strategy name and gathers reserves in a single buffer, last, in protocol mode', function () {
      const items = toCompositionItems({
        data,
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items).toEqual([
        {
          amount: BigInt(80),
          isReserveBuffer: false,
          name: 'Strategy A2',
          share: 0.4,
        },
        {
          amount: BigInt(50),
          isReserveBuffer: false,
          name: 'Strategy B1',
          share: 0.25,
        },
        {
          amount: BigInt(30),
          isReserveBuffer: false,
          name: 'Strategy A1',
          share: 0.15,
        },
        {
          amount: BigInt(40),
          isReserveBuffer: true,
          name: reserveBufferLabel,
          share: 0.15 + 0.05,
        },
      ])
    })

    it('keeps the reserve buffer last even when it outweighs every strategy', function () {
      const items = toCompositionItems({
        data: [
          {
            amount: BigInt(25),
            name: 'Strategy',
            share: 0.25,
            symbol: 'USDC',
            token: tokenA,
            type: 'strategy',
          },
          {
            amount: BigInt(75),
            share: 0.75,
            symbol: 'USDC',
            token: tokenA,
            type: 'reserve',
          },
        ],
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items.map(item => item.name)).toEqual([
        'Strategy',
        reserveBufferLabel,
      ])
    })

    it('omits the reserve buffer and empty items when there is no amount', function () {
      const items = toCompositionItems({
        data: [
          {
            amount: BigInt(100),
            name: 'Strategy',
            share: 1,
            symbol: 'USDC',
            token: tokenA,
            type: 'strategy',
          },
          {
            amount: BigInt(0),
            share: 0,
            symbol: 'USDC',
            token: tokenA,
            type: 'reserve',
          },
        ],
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items).toEqual([
        {
          amount: BigInt(100),
          isReserveBuffer: false,
          name: 'Strategy',
          share: 1,
        },
      ])
    })

    it('returns no items for an empty composition', function () {
      expect(
        toCompositionItems({
          data: [],
          reserveBufferLabel,
          viewMode: 'token',
        }),
      ).toEqual([])
    })
  })
})
