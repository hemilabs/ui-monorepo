import * as Sentry from '@sentry/nextjs'
import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { useEffect } from 'react'
import { isValidUrl } from 'utils/url'

const pricesUrl = process.env.NEXT_PUBLIC_TOKEN_PRICES_URL

type Prices = Record<string, string>

export const useTokenPrices = function () {
  const query = useQuery({
    // If the URL is not set, prices are not returned. Consumers of the hook
    // should consider this scenario
    enabled: pricesUrl !== undefined && isValidUrl(pricesUrl),
    queryFn: () =>
      fetch(pricesUrl).then(({ prices }) => prices) as Promise<Prices>,
    queryKey: ['token-prices'],
    // refetch every 5 min
    refetchInterval: 5 * 60 * 1000,
  })

  const { error } = query

  useEffect(
    function captureTokenPriceError() {
      if (error) {
        Sentry.captureException(
          new Error('Failed to fetch the Token Prices api', { cause: error }),
        )
      }
    },
    [error],
  )

  return query
}
