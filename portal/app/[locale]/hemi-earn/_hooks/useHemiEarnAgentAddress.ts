import { queryOptions } from '@tanstack/react-query'
import { getAgentAddress } from 'hemi-earn-actions/actions'
import { getPublicClient } from 'utils/chainClients'
import { hemi } from 'viem/chains'

export const agentAddressQueryOptions = () =>
  queryOptions({
    gcTime: Infinity,
    queryFn: () => getAgentAddress(getPublicClient(hemi.id)),
    queryKey: ['hemi-earn', 'agent-address'],
    // Immutable once the peer is set, so cache it indefinitely.
    staleTime: Infinity,
  })
