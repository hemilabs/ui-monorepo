import {
  allowanceQueryKey,
  useAllowance,
} from '@hemilabs/react-hooks/useAllowance'
import { Address, Chain } from 'viem'
import { useAccount } from 'wagmi'

export const useNeedsApprovalQuery = function ({
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

  const token = { address: address as Address, chainId }

  const {
    data: allowance = BigInt(0),
    isError,
    isLoading,
    status: allowanceStatus,
  } = useAllowance({
    owner,
    spender,
    token,
  })

  const allowanceQueryKeyValue = allowanceQueryKey({ owner, spender, token })

  return {
    allowanceQueryKey: allowanceQueryKeyValue,
    isAllowanceError: isError,
    isAllowanceLoading: isLoading,
    needsApproval: amount > allowance && allowanceStatus === 'success',
  }
}
