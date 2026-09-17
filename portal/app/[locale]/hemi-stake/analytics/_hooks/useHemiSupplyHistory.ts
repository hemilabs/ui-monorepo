import { useQuery } from '@tanstack/react-query'
import { useHemiToken } from 'hooks/useHemiToken'

import { fetchHemiSupplyHistory } from '../_fetchers/fetchHemiSupplyHistory'
import {
  parseSupplyPoints,
  type ParsedSupplyPoint,
  type SupplyPeriod,
} from '../_utils/supplyHistory'

// `decimals` is read inside the queryFn but deliberately left out of the key:
// it is a constant of the token, so keeping it out means callers elsewhere can
// rebuild the key from the period alone.
const getHemiSupplyHistoryQueryKey = (period: SupplyPeriod) => [
  'hemi-stake',
  'supply-history',
  period,
]

export const useHemiSupplyHistory = function <TData = ParsedSupplyPoint[]>({
  period,
  select,
}: {
  period: SupplyPeriod
  select?: (points: ParsedSupplyPoint[]) => TData
}) {
  const { decimals } = useHemiToken()

  return useQuery({
    queryFn: async () =>
      parseSupplyPoints(await fetchHemiSupplyHistory(period), decimals),
    queryKey: getHemiSupplyHistoryQueryKey(period),
    refetchInterval: 1000 * 60 * 5,
    select,
    staleTime: 1000 * 60 * 5,
  })
}
