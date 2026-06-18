import { gateways } from '@vetro-protocol/gateway'
import {
  type CompositionData,
  fetchComposition,
  toCompositionItems,
} from 'app/[locale]/hemi-earn/_fetchers/fetchComposition'
import { gatewayForShareQueryOptions } from 'app/[locale]/hemi-earn/_hooks/gatewayForShare'
import fetch from 'fetch-plus-plus'
import { tokenQueryOptions } from 'hooks/useToken'
import { tokenPricesQueryOptions } from 'hooks/useTokenPrices'
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

// The treasury endpoint call — the only direct network request of the fetcher.
vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const shareAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address

const apiUrl = 'https://vetro.test'
// Real gateway configs, so the peg-base lookup exercises the production data.
const btcGateway = gateways.find(g => g.pegBaseSymbol === 'BTC')!.address
const usdGateway = gateways.find(g => g.pegBaseSymbol === 'USD')!.address

const tokenA = '0x1111111111111111111111111111111111111111' as Address
const tokenB = '0x2222222222222222222222222222222222222222' as Address

const makeToken = (
  address: Address,
  decimals: number,
  symbol: string,
): Token => ({
  address,
  chainId: mainnet.id,
  decimals,
  logoURI: '',
  name: symbol,
  symbol,
})

const seedQueryClient = function ({
  gateway,
  prices,
  tokens,
}: {
  gateway: Address
  prices: Record<string, string>
  tokens: Token[]
}) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(
    gatewayForShareQueryOptions(shareAddress).queryKey,
    gateway,
  )
  queryClient.setQueryData(tokenPricesQueryOptions().queryKey, prices)
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
    it('prices each token and strategy via the peg', async function () {
      const queryClient = seedQueryClient({
        gateway: btcGateway,
        prices: { BTC: '100000' },
        tokens: [makeToken(tokenA, 8, 'WBTC'), makeToken(tokenB, 18, 'cbBTC')],
      })
      vi.mocked(fetch).mockResolvedValue([
        {
          activeStrategies: [
            // 1.0 and 0.5 tokens, oracle 1.0 BTC each
            { name: 'Strategy A1', totalDebt: '100000000' },
            { name: 'Strategy A2', totalDebt: '50000000' },
          ],
          latestPrice: '100000000',
          priceDecimals: 8,
          tokenAddress: tokenA,
          totalDebt: '150000000',
          // 0.25 tokens sit idle
          withdrawable: '175000000',
        },
        {
          // 0.5 tokens, oracle 2.0 BTC, nothing idle
          activeStrategies: [
            { name: 'Strategy B1', totalDebt: '500000000000000000' },
          ],
          latestPrice: '2000000000000000000',
          priceDecimals: 18,
          tokenAddress: tokenB,
          totalDebt: '500000000000000000',
          withdrawable: '500000000000000000',
        },
      ])

      const result = await fetchComposition({
        apiUrl,
        queryClient,
        shareAddress,
      })

      expect(result).toEqual([
        {
          strategies: [
            { amount: 100_000, name: 'Strategy A1' },
            { amount: 50_000, name: 'Strategy A2' },
          ],
          symbol: 'WBTC',
          totalDebt: 150_000,
          withdrawable: 175_000,
        },
        {
          strategies: [{ amount: 100_000, name: 'Strategy B1' }],
          symbol: 'cbBTC',
          totalDebt: 100_000,
          withdrawable: 100_000,
        },
      ])
      expect(fetch).toHaveBeenCalledWith(
        `${apiUrl}/analytics/treasury/${btcGateway}`,
      )
    })

    it('treats USD pegs as the identity, without a feed entry', async function () {
      const queryClient = seedQueryClient({
        gateway: usdGateway,
        prices: {},
        tokens: [makeToken(tokenA, 6, 'satUSD')],
      })
      vi.mocked(fetch).mockResolvedValue([
        {
          // 1.0 tokens at an oracle price of 1.0 USD
          activeStrategies: [{ name: 'Strategy', totalDebt: '1000000' }],
          latestPrice: '100000000',
          priceDecimals: 8,
          tokenAddress: tokenA,
          totalDebt: '1000000',
          withdrawable: '1000000',
        },
      ])

      const result = await fetchComposition({
        apiUrl,
        queryClient,
        shareAddress,
      })

      expect(result).toEqual([
        {
          strategies: [{ amount: 1, name: 'Strategy' }],
          symbol: 'satUSD',
          totalDebt: 1,
          withdrawable: 1,
        },
      ])
    })

    it('rejects when the gateway has no peg configuration', async function () {
      const queryClient = seedQueryClient({
        gateway: '0x00000000000000000000000000000000000000aa' as Address,
        prices: {},
        tokens: [],
      })

      await expect(
        fetchComposition({ apiUrl, queryClient, shareAddress }),
      ).rejects.toThrow(/No peg base symbol for gateway/)
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('toCompositionItems', function () {
    const reserveBufferLabel = 'Reserve Buffer'
    const data: CompositionData = [
      {
        strategies: [
          { amount: 75, name: 'Strategy A1' },
          { amount: 50, name: 'Strategy A2' },
        ],
        symbol: 'WBTC',
        totalDebt: 125,
        withdrawable: 150, // 25 idle
      },
      {
        strategies: [{ amount: 25, name: 'Strategy B1' }],
        symbol: 'cbBTC',
        totalDebt: 25,
        withdrawable: 50, // 25 idle
      },
    ]

    it('groups by strategy and appends the reserve buffer in protocol mode', function () {
      const items = toCompositionItems({
        data,
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items).toEqual([
        {
          amount: 75,
          isReserveBuffer: false,
          name: 'Strategy A1',
          share: 37.5,
        },
        {
          amount: 50,
          isReserveBuffer: false,
          name: 'Strategy A2',
          share: 25,
        },
        {
          amount: 25,
          isReserveBuffer: false,
          name: 'Strategy B1',
          share: 12.5,
        },
        {
          amount: 50,
          isReserveBuffer: true,
          name: reserveBufferLabel,
          share: 25,
        },
      ])
    })

    it('groups by token, with idle funds folded into each token', function () {
      const items = toCompositionItems({
        data,
        reserveBufferLabel,
        viewMode: 'token',
      })

      expect(items).toEqual([
        {
          amount: 150,
          isReserveBuffer: false,
          name: 'WBTC',
          share: 75,
        },
        {
          amount: 50,
          isReserveBuffer: false,
          name: 'cbBTC',
          share: 25,
        },
      ])
    })

    it('omits the reserve buffer when nothing is idle', function () {
      const items = toCompositionItems({
        data: [
          {
            strategies: [{ amount: 100, name: 'Strategy' }],
            symbol: 'WBTC',
            totalDebt: 100,
            withdrawable: 100,
          },
        ],
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items).toEqual([
        {
          amount: 100,
          isReserveBuffer: false,
          name: 'Strategy',
          share: 100,
        },
      ])
    })

    it('clamps a negative reserve buffer to zero', function () {
      const items = toCompositionItems({
        data: [
          {
            // strategies report more debt than is withdrawable
            strategies: [{ amount: 150, name: 'Strategy' }],
            symbol: 'WBTC',
            totalDebt: 150,
            withdrawable: 100,
          },
        ],
        reserveBufferLabel,
        viewMode: 'protocol',
      })

      expect(items).toEqual([
        {
          amount: 150,
          isReserveBuffer: false,
          name: 'Strategy',
          share: 100,
        },
      ])
    })

    it('drops zero amounts in both modes', function () {
      const zeroed: CompositionData = [
        {
          strategies: [
            { amount: 0, name: 'Empty' },
            { amount: 100, name: 'Active' },
          ],
          symbol: 'WBTC',
          totalDebt: 100,
          withdrawable: 100,
        },
        {
          strategies: [],
          symbol: 'cbBTC',
          totalDebt: 0,
          withdrawable: 0,
        },
      ]

      expect(
        toCompositionItems({
          data: zeroed,
          reserveBufferLabel,
          viewMode: 'protocol',
        }),
      ).toEqual([
        {
          amount: 100,
          isReserveBuffer: false,
          name: 'Active',
          share: 100,
        },
      ])
      expect(
        toCompositionItems({
          data: zeroed,
          reserveBufferLabel,
          viewMode: 'token',
        }),
      ).toEqual([
        {
          amount: 100,
          isReserveBuffer: false,
          name: 'WBTC',
          share: 100,
        },
      ])
    })
  })
})
