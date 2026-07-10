'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFailedRequest } from 'hemi-earn-actions/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address, isAddressEqual, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { isRemoteFailed } from '../_utils'
import { type EarnTransaction } from '../types'

import { agentAddressQueryOptions } from './useHemiEarnAgentAddress'

export const getFailedRequestQueryKey = (
  account: Address | undefined,
  requestId: string | undefined,
) => ['hemi-earn', 'failed-request', account, requestId]

// Reads the Agent's on-chain failedRequests entry: tokenIn !== zeroAddress means the request is
// still stuck (the contract deletes the entry on retry/cancel), which the CTA gate keys off.
export const useFailedRequest = function (
  transaction: EarnTransaction | undefined,
) {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const requestId = transaction?.requestId

  return useQuery({
    enabled: !!address && isRemoteFailed(transaction),
    async queryFn() {
      const agentAddress = await queryClient.ensureQueryData(
        agentAddressQueryOptions(),
      )
      return getFailedRequest({
        agentAddress,
        client: getEvmL1PublicClient(mainnet.id),
        requestId: BigInt(requestId!),
      })
    },
    queryKey: getFailedRequestQueryKey(address, requestId),
    // Poll while stuck; stop once the entry is cleared on-chain (keeper resolved it) so we
    // don't keep reading an empty struct until the subgraph re-indexes off FAILED.
    refetchInterval: query =>
      query.state.data && isAddressEqual(query.state.data.tokenIn, zeroAddress)
        ? false
        : 10_000,
  })
}
