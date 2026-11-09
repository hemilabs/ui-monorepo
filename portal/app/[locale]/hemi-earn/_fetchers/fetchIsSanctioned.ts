import { queryOptions } from '@tanstack/react-query'
import { mainnet } from 'networks/mainnet'
import { getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { isSanctioned } from 'viem-sanctions-oracle/actions'

export const fetchIsSanctioned = async function (account: Address | undefined) {
  if (account === undefined) {
    return false
  }
  return isSanctioned(getPublicClient(mainnet.id), { account })
}

const getIsSanctionedQueryKey = (account: Address | undefined) =>
  ['hemi-earn', 'sanctions', account] as const

export const isSanctionedQueryOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: () => fetchIsSanctioned(account),
    queryKey: getIsSanctionedQueryKey(account),
    retry: 1,
    staleTime: 1000 * 60 * 60,
  })
