import { QueryClient } from '@tanstack/react-query'
import { invalidateRewardsForecastInputs } from 'app/[locale]/hemi-stake/_hooks/useRewardsForecastInputs'
import { describe, expect, it } from 'vitest'

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

  it('should leave other chains untouched', function () {
    const queryClient = seed()

    invalidateRewardsForecastInputs(queryClient, chainId)

    expect(
      keys(otherChainId).map(key => isInvalidated(queryClient, key)),
    ).toEqual([false, false])
  })
})
