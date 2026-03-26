import { useAllowance } from '@hemilabs/react-hooks/useAllowance'
import { type UseQueryOptions } from '@tanstack/react-query'
import {
  buildAllowanceQueryKey,
  normalizeTokenAddressForAllowance,
} from 'utils/allowanceQueryKey'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, type Chain, isAddress } from 'viem'
import { useAccount } from 'wagmi'

type AllowanceQuery = Omit<
  UseQueryOptions<bigint, Error, bigint>,
  'queryFn' | 'queryKey' | 'enabled'
> & { enabled?: boolean }

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
  const effectiveSpender = isNativeAddress(address) ? undefined : spender
  const token = {
    address: normalizeTokenAddressForAllowance(address),
    chainId,
  }
  const allowanceKey = buildAllowanceQueryKey({
    chainId,
    owner,
    spender: effectiveSpender,
    tokenAddress: address,
  })

  const query: AllowanceQuery = {
    enabled:
      !isNativeAddress(address) &&
      isAddress(address) &&
      !!owner &&
      !!effectiveSpender,
  }

  const {
    data: allowance = BigInt(0),
    isError,
    isLoading,
    status: allowanceStatus,
  } = useAllowance({
    owner,
    query,
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
