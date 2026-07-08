import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { earnTokenPricesQueryOptions } from '../_fetchers/fetchEarnTokenPrices'

type Prices = Record<string, string>

// Use this (not useTokenPrices) for Hemi Earn prices — it adds gateway oracle prices
// so pegged tokens (vetBTC, VUSD) resolve via their priceSymbol alias.
export const useEarnTokenPrices = (
  options: Omit<UseQueryOptions<Prices, Error>, 'queryKey' | 'queryFn'> = {},
) => useQuery(earnTokenPricesQueryOptions(options))
