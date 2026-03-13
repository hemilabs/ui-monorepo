import {
  allowanceQueryKey,
  useAllowance,
} from '@hemilabs/react-hooks/useAllowance'
import { isNativeAddress } from 'utils/nativeToken'
import { Address, Chain, isAddress, zeroAddress } from 'viem'
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

  const isErc20Address =
    isAddress(address, { strict: false }) && !isNativeAddress(address)

  const token = {
    address: (isErc20Address ? address : zeroAddress) as Address,
    chainId,
  }

  const effectiveOwner = isErc20Address ? owner : undefined

  const {
    data: allowance = BigInt(0),
    isError,
    isLoading,
    status: allowanceStatus,
  } = useAllowance({
    owner: effectiveOwner,
    spender,
    token,
  })

  const allowanceQueryKeyValue = allowanceQueryKey({
    owner: effectiveOwner,
    spender,
    token,
  })

  return {
    allowanceQueryKey: allowanceQueryKeyValue,
    isAllowanceError: isError,
    isAllowanceLoading: isLoading,
    needsApproval: amount > allowance && allowanceStatus === 'success',
  }
}
