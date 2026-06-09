import { queryOptions, useQuery } from '@tanstack/react-query'
import { getAgentAddress } from 'hemi-earn-actions/actions'
import { getPublicClient } from 'utils/chainClients'
import { hemi } from 'viem/chains'

export const agentAddressQueryOptions = () =>
  queryOptions({
    queryFn: () => getAgentAddress(getPublicClient(hemi.id)),
    queryKey: ['hemi-earn', 'agent-address'],
    // `Router.peerAddress()` on Hemi, decoded to the Agent address on Ethereum.
    // Immutable once the peer is set, so cache it indefinitely.
    staleTime: Infinity,
  })

export const useHemiEarnAgentAddress = () =>
  useQuery(agentAddressQueryOptions())
