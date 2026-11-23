import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { invalidateRewardsForecastInputs } from 'app/[locale]/hemi-stake/_hooks/useRewardsForecastInputs'
import { describe, expect, it, vi } from 'vitest'

const chainId = 43111
const otherChainId = 743111

const keys = (id: number) => [
  ['classDenominators', id, 5],
  ['rewardsForecastInputs', id, 5, '0xtoken'],
]

const seed = function () {
  const queryClient = new QueryClient()
  ;[...keys(chainId), ...keys(otherChainId)].forEach(queryKey =>
    queryClient.setQueryData(queryKey, {}),
  )
  return queryClient
}

const isInvalidated = (queryClient: QueryClient, queryKey: unknown[]) =>
  queryClient.getQueryState(queryKey)?.isInvalidated

describe('invalidateRewardsForecastInputs', function () {
  it('should invalidate the denominators and the forecast inputs of the chain', function () {
    const queryClient = seed()

    invalidateRewardsForecastInputs(queryClient, chainId)

    expect(keys(chainId).map(key => isInvalidated(queryClient, key))).toEqual([
      true,
      true,
    ])
  })

  it('should refetch an observed forecast with the new denominators', async function () {
    const queryClient = new QueryClient()
    const [denominatorsKey, forecastKey] = keys(chainId)
    const staleTime = 5 * 60 * 1000
    let denominator = 1
    const observer = new QueryObserver(queryClient, {
      queryFn: () =>
        queryClient.fetchQuery({
          queryFn: () => denominator,
          queryKey: denominatorsKey,
          staleTime,
        }),
      queryKey: forecastKey,
      staleTime,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.waitFor(() => expect(observer.getCurrentResult().data).toBe(1))

    denominator = 2
    invalidateRewardsForecastInputs(queryClient, chainId)

    await vi.waitFor(() => expect(observer.getCurrentResult().data).toBe(2))
    unsubscribe()
  })

  it('should leave other chains untouched', function () {
    const queryClient = seed()

    invalidateRewardsForecastInputs(queryClient, chainId)

    expect(
      keys(otherChainId).map(key => isInvalidated(queryClient, key)),
    ).toEqual([false, false])
  })
})
