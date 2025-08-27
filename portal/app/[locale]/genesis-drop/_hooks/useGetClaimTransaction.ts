import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { LockupMonths } from 'genesis-drop-actions'
import { useHemi } from 'hooks/useHemi'
import { Address, Chain, Hash } from 'viem'
import { useAccount } from 'wagmi'

type Response = {
  account: Address
  amount: string
  lockupMonths: LockupMonths
  ratio: number
  transactionHash: Hash
}

type ParsedResponse = Omit<Response, 'amount'> & { amount: bigint }

export const getClaimTransactionQueryKey = ({
  address,
  chainId,
  claimGroupId,
}: {
  address: Address
  chainId: Chain['id']
  claimGroupId: number
}) => [
  'hemi-token-claim-transaction',
  chainId.toString(),
  address.toString(),
  claimGroupId,
]

export const useGetClaimTransaction = function (
  claimGroupId: number,
  options: Omit<
    UseQueryOptions<ParsedResponse | null>,
    'enabled' | 'queryFn' | 'queryKey'
  > = {},
) {
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: !!address && claimGroupId !== undefined,
    async queryFn() {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUBGRAPHS_API_URL}/${hemi.id}/claim/${address}/${claimGroupId}`,
      )

      if (!response.ok) {
        return null
      }

      const data: Response = await response.json()

      return {
        account: data.account,
        amount: BigInt(data.amount),
        lockupMonths: data.lockupMonths,
        ratio: data.ratio,
        transactionHash: data.transactionHash,
      } satisfies ParsedResponse
    },
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
