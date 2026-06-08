import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'

import {
  fetchRequestDetails,
  requestDetailsKeyPrefix,
} from '../_fetchers/fetchRequestDetails'

// `claimableAt` is set by the Vetro Agent the moment it observes the
// LayerZero request and never changes after that, so caching forever is
// safe. Pass `requestId === undefined` (e.g. before the subgraph has
// indexed the request) to leave the query disabled.
export const useRequestDetails = ({
  requestId,
  shareAddress,
}: {
  requestId: bigint | string | undefined
  shareAddress: Address
}) =>
  useQuery({
    enabled: requestId !== undefined,
    queryFn: () => fetchRequestDetails({ requestId: requestId!, shareAddress }),
    queryKey: [...requestDetailsKeyPrefix, shareAddress, requestId?.toString()],
    staleTime: Infinity,
  })
