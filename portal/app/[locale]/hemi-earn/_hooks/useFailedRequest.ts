import { useQuery } from '@tanstack/react-query'
import { hemiEarnAgentAddress } from '@vetro-protocol/hemi-earn'
import { getFailedRequest } from '@vetro-protocol/hemi-earn/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address, isAddressEqual, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { isRemoteFailed } from '../_utils/transactionPredicates'
import { type EarnTransaction } from '../types'

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

  const requestId = transaction?.requestId

  return useQuery({
    enabled: !!address && isRemoteFailed(transaction),
    queryFn() {
      if (requestId === undefined) {
        throw new Error('useFailedRequest: missing requestId')
      }
      return getFailedRequest(getEvmL1PublicClient(mainnet.id), {
        address: hemiEarnAgentAddress,
        requestId: BigInt(requestId),
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
