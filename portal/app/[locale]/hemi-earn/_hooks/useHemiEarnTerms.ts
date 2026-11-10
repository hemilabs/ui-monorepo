import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'

import {
  fetchHemiEarnTerms,
  hemiEarnTermsKeyPrefix,
} from '../_fetchers/fetchHemiEarnTerms'

export const useHemiEarnTerms = function () {
  const [networkType] = useNetworkType()

  return useQuery({
    enabled: networkType === 'mainnet',
    queryFn: () => fetchHemiEarnTerms(import.meta.env.VITE_VETRO_API_URL),
    queryKey: [...hemiEarnTermsKeyPrefix, networkType],
    retry: 2,
  })
}
