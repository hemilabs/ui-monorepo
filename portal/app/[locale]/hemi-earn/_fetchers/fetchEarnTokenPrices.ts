import {
  type QueryClient,
  type UseQueryOptions,
  queryOptions,
} from '@tanstack/react-query'
import { gateways } from '@vetro-protocol/gateway'
import { tokenPricesQueryOptions } from 'hooks/useTokenPrices'

import { oraclePricesQueryOptions } from './fetchOraclePrices'

type Prices = Record<string, string>

// USD peg = identity; other pegs convert via portal price, degrading to $0 (not a crash) if missing.
const pegToUsdRate = (pegBaseSymbol: string, portal: Prices) =>
  pegBaseSymbol === 'USD' ? 1 : Number(portal[pegBaseSymbol] ?? 0)

// Portal /prices feed extended with each gateway's oracle prices (converted to USD;
// oracle wins on symbol collision). Pegged tokens (vetBTC, VUSD) have no oracle —
// priced via an extensions.priceSymbol alias. Earn-scoped.
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
    refetchInterval: 5 * 60 * 1000,
    staleTime: 30 * 1000,
    ...options,
  })
