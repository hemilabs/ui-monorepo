import { queryOptions, useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import {
  fetchHemiEarnTermsAcceptance,
  hemiEarnTermsAcceptanceKeyPrefix,
} from '../_fetchers/fetchHemiEarnTermsAcceptance'

export const hemiEarnTermsAcceptanceQueryOptions = ({
  account,
  networkType,
}: {
  account: Address | undefined
  networkType: string
}) =>
  queryOptions({
    enabled: !!account && networkType === 'mainnet',
    queryFn: () =>
      fetchHemiEarnTermsAcceptance({
        account: account!,
        apiUrl: import.meta.env.VITE_VETRO_API_URL,
      }),
    queryKey: [...hemiEarnTermsAcceptanceKeyPrefix, networkType, account],
    refetchOnWindowFocus: false,
    retry: 2,
  })

export const useHemiEarnTermsAcceptance = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()

  return useQuery(
    hemiEarnTermsAcceptanceQueryOptions({ account: address, networkType }),
  )
}
