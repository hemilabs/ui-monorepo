import {
  allowanceQueryKey,
  useAllowance,
} from '@hemilabs/react-hooks/useAllowance'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, type Chain, isAddress, zeroAddress } from 'viem'
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
  const erc20Address: Address = isAddress(address) ? address : zeroAddress
  const effectiveSpender = isNativeAddress(address) ? undefined : spender
  const token = { address: erc20Address, chainId }
  const allowanceKey = allowanceQueryKey({
    owner,
    spender: effectiveSpender,
    token,
  })

  const {
    data: allowance = BigInt(0),
    isError,
    isLoading,
    status: allowanceStatus,
  } = useAllowance({
    owner,
    spender: effectiveSpender,
    token,
  })

  return {
    allowanceQueryKey: allowanceKey,
    isAllowanceError: isError,
    isAllowanceLoading: isLoading,
    needsApproval: amount > allowance && allowanceStatus === 'success',
  }
}
