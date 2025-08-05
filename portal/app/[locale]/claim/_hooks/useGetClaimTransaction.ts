import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { LockupMonths } from 'tge-claim'
import { Address, Chain, Hash } from 'viem'
import { useAccount } from 'wagmi'

const getClaimTransactionQueryKey = ({
  address,
  chainId,
}: {
  address: Address
  chainId: Chain['id']
}) => ['hemi-token-claim-transaction', chainId.toString(), address]

export const useGetClaimTransaction = function () {
  const { address } = useAccount()
  const hemi = useHemi()

  return useQuery({
    enabled: !!address,
    // TODO implement subgraph that returns transaction data
    queryFn: () =>
      Promise.resolve(undefined) as Promise<
        | {
            amount: bigint
            txHash: Hash
            ratio: number
            lockupMonths: LockupMonths
          }
        | undefined
      >,

    queryKey: getClaimTransactionQueryKey({ address, chainId: hemi.id }),
    // as it's likely this is called when the user has not claimed, undefined is returning
    // to react-query, that means as if the query has failed. That's ok, but on windows focus
    // (when the user comes back to the tab), this triggers a revalidation, and as it can't return a cached
    // value, isLoading becomes "true", tearing down the whole UI. So that's why this is disabled
    refetchOnWindowFocus: false,
    retry: false,
  })
}
