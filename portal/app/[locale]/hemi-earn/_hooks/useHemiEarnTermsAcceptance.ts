import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import {
  fetchHemiEarnTermsAcceptance,
  hemiEarnTermsAcceptanceKeyPrefix,
} from '../_fetchers/fetchHemiEarnTermsAcceptance'

export const useHemiEarnTermsAcceptance = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()

  return useQuery({
    enabled: !!address && networkType === 'mainnet',
    queryFn: () =>
      fetchHemiEarnTermsAcceptance({
        account: address!,
        apiUrl: import.meta.env.VITE_VETRO_API_URL,
      }),
    queryKey: [...hemiEarnTermsAcceptanceKeyPrefix, networkType, address],
    retry: 2,
  })
}
