import { useAllowance } from 'hooks/useAllowance'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

export const useNeedsApproval = function ({
  address,
  amount,
  chainId,
  spender,
}: {
  address: string
  amount: bigint
  spender: Address
  chainId: Chain['id']
}) {
  const { address: owner } = useAccount()

  const {
    data: allowance = BigInt(0),
    isError,
    isLoading,
    queryKey: allowanceQueryKey,
    status: allowanceStatus,
  } = useAllowance(address, {
    args: { owner, spender },
    chainId,
  })

  return {
    allowanceQueryKey,
    isAllowanceError: isError,
    isAllowanceLoading: isLoading,
    needsApproval: amount > allowance && allowanceStatus === 'success',
  }
}
