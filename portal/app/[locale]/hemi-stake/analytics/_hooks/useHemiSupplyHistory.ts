import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type Chain } from 'viem'

import { fetchHemiSupplyHistory } from '../_fetchers/fetchHemiSupplyHistory'
import {
  parseSupplyPoints,
  type ParsedSupplyPoint,
} from '../_utils/supplyHistory'

// `decimals` is read inside the queryFn but deliberately left out of the key:
// it is a constant of the token, so keeping it out means callers elsewhere can
// rebuild the key from the chain alone.
const getHemiSupplyHistoryQueryKey = (chainId: Chain['id']) => [
  'hemi-stake',
  'supply-history',
  chainId,
]

export const useHemiSupplyHistory = function <TData = ParsedSupplyPoint[]>(
  select?: (points: ParsedSupplyPoint[]) => TData,
) {
  const chainId = useHemi().id
  const { decimals } = useHemiToken()

  return useQuery({
    queryFn: async () =>
      parseSupplyPoints(await fetchHemiSupplyHistory(), decimals),
    queryKey: getHemiSupplyHistoryQueryKey(chainId),
    refetchInterval: 1000 * 60 * 5,
    select,
    staleTime: 1000 * 60 * 5,
  })
}
