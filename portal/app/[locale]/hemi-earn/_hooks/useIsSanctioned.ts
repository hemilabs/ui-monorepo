import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import { isSanctionedQueryOptions } from '../_fetchers/fetchIsSanctioned'

export const useIsSanctioned = function () {
  const { address } = useAccount()
  return useQuery(isSanctionedQueryOptions(address))
}
