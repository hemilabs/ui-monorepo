import { queryOptions } from '@tanstack/react-query'
import { getMaxClaimPairs } from 've-hemi-epoch-rewards/actions'
import { type Client } from 'viem'

export const getMaxClaimPairsQueryOptions = ({
  chainId,
  hemiClient,
}: {
  chainId: number
  hemiClient: Client
}) =>
  queryOptions({
    gcTime: Infinity,
    queryFn: () => getMaxClaimPairs(hemiClient),
    queryKey: ['maxClaimPairs', chainId],
    staleTime: Infinity,
  })
