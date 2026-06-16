import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { earnTokenPricesQueryOptions } from '../_fetchers/fetchEarnTokenPrices'

type Prices = Record<string, string>

// USD prices for Hemi Earn: `useTokenPrices` (the portal `/prices` feed)
// extended with each gateway's on-chain oracle prices (see
// `fetchEarnTokenPrices`). Use this — rather than `useTokenPrices` — anywhere
// Hemi Earn prices a pegged token (vetBTC, VUSD), which resolves through its
// `extensions.priceSymbol` whitelisted-proxy alias.
export const useEarnTokenPrices = (
  options: Omit<UseQueryOptions<Prices, Error>, 'queryKey' | 'queryFn'> = {},
) => useQuery(earnTokenPricesQueryOptions(options))
