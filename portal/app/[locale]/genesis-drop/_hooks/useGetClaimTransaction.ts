import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { getClaimTransaction, ParsedClaimTransaction } from 'utils/subgraph'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

export const getClaimTransactionQueryKey = ({
  address,
  chainId,
  claimGroupId,
}: {
  address: Address | undefined
  chainId: Chain['id']
  claimGroupId: number
}) => [
  'hemi-token-claim-transaction',
  chainId.toString(),
  address?.toString(),
  claimGroupId,
]

export const useGetClaimTransaction = function (
  claimGroupId: number,
  options: Omit<
    UseQueryOptions<ParsedClaimTransaction | null>,
    'enabled' | 'queryFn' | 'queryKey'
  > = {},
) {
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: !!address && claimGroupId !== undefined,
    queryFn: () =>
      getClaimTransaction({
        address: address!,
        chainId: hemi.id,
        claimGroupId,
      }),
    queryKey: getClaimTransactionQueryKey({
      address,
      chainId: hemi.id,
      claimGroupId,
    }),
    // as it's likely this is called when the user has not claimed, undefined is returning
    // to react-query, that means as if the query has failed. That's ok, but on windows focus
    // (when the user comes back to the tab), this triggers a revalidation, and as it can't return a cached
    // value, isLoading becomes "true", tearing down the whole UI. So that's why this is disabled
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  })
}
