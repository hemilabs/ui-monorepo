import { useAllowance } from 'hooks/useAllowance'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

export const useNeedsApproval = function ({
  address,
  amount,
  spender,
}: {
  address: string
  amount: bigint
  spender: Address
}) {
  const { address: owner } = useAccount()

  const {
    data: allowance = BigInt(0),
    isLoading,
    status: allowanceStatus,
    queryKey: allowanceQueryKey,
  } = useAllowance(address, {
    args: { owner, spender },
  })

  return {
    allowanceQueryKey,
    isLoadingAllowance: isLoading,
    needsApproval: amount > allowance && allowanceStatus === 'success',
  }
}
