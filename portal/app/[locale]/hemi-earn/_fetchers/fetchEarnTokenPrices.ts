import {
  type QueryClient,
  type UseQueryOptions,
  queryOptions,
} from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import { tokenPricesQueryOptions } from 'hooks/useTokenPrices'

import { oraclePricesQueryOptions } from './fetchOraclePrices'

type Prices = Record<string, string>

// "USD" pegs are the identity; any other peg unit (BTC, ETH) is converted to
// USD with its portal price. A missing peg price degrades that gateway's
// tokens to $0 rather than crashing.
const pegToUsdRate = (pegBaseSymbol: string, portal: Prices) =>
  pegBaseSymbol === 'USD' ? 1 : Number(portal[pegBaseSymbol] ?? 0)

// The Hemi Earn price feed: the app-wide portal `/prices` feed (`useTokenPrices`)
// extended with each gateway's on-chain oracle prices. Oracle entries are
// denominated in the gateway's peg unit, converted to USD (× the peg's USD
// price) and override the portal entry on symbol collision, since the oracle is
// the source the protocol itself uses. A pegged token (vetBTC, VUSD) has no
// oracle of its own; it is priced by aliasing to a whitelisted proxy in its
// gateway via `extensions.priceSymbol` (vetBTC→WBTC, VUSD→USDT), resolved
// downstream by `getTokenPrice`. Kept earn-scoped so the rest of the app keeps
// using the plain portal feed.
export const fetchEarnTokenPrices = async function (
  queryClient: QueryClient,
): Promise<Prices> {
  const [portal, gatewaysWithOracle] = await Promise.all([
    queryClient.ensureQueryData(tokenPricesQueryOptions()),
    Promise.all(
      gateways.map(async gateway => ({
        gateway,
        oracle: await queryClient.ensureQueryData(
          oraclePricesQueryOptions(gateway.address),
        ),
      })),
    ),
  ])

  return {
    ...portal,
    ...Object.fromEntries(
      gatewaysWithOracle.flatMap(({ gateway, oracle }) =>
        Object.entries(oracle).map(
          ([symbol, peggedPrice]) =>
            [
              symbol,
              String(
                Number(peggedPrice) *
                  pegToUsdRate(gateway.pegBaseSymbol, portal),
              ),
            ] as const,
        ),
      ),
    ),
  }
}

export const earnTokenPricesQueryOptions = (
  options: Omit<UseQueryOptions<Prices, Error>, 'queryKey' | 'queryFn'> = {},
) =>
  queryOptions({
    queryFn: ({ client }) => fetchEarnTokenPrices(client),
    queryKey: ['hemi-earn', 'token-prices'],
    // refetch every 5 min
    refetchInterval: 5 * 60 * 1000,
    staleTime: 30 * 1000,
    ...options,
  })
