import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'

const pricesUrl = process.env.NEXT_PUBLIC_TOKEN_PRICES_URL

type Prices = Record<string, string>

export const useTokenPrices = (
  options: Omit<UseQueryOptions<Prices, Error>, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    // If the URL is not set, prices are not returned. Consumers of the hook
    // should consider this scenario
    enabled: pricesUrl !== undefined && isValidUrl(pricesUrl),
    queryFn: () =>
      fetch(pricesUrl).then(({ prices }) => prices) as Promise<Prices>,
    queryKey: ['token-prices'],
    // refetch every 5 min
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    ...options,
  })
