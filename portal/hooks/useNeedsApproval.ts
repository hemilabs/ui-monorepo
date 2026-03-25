import {
  allowanceQueryKey,
  useAllowance,
} from '@hemilabs/react-hooks/useAllowance'
import { type UseQueryOptions } from '@tanstack/react-query'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, type Chain, isAddress, zeroAddress } from 'viem'
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
  const erc20Address: Address = isAddress(address) ? address : zeroAddress
  const effectiveSpender = isNativeAddress(address) ? undefined : spender
  const token = { address: erc20Address, chainId }
  const allowanceKey = allowanceQueryKey({
    owner,
    spender: effectiveSpender,
    token,
  })
  const query = {
    enabled:
      !isNativeAddress(address) &&
      isAddress(address) &&
      !!owner &&
      !!effectiveSpender,
  } satisfies AllowanceQuery as unknown as Omit<
    UseQueryOptions<bigint, Error, bigint>,
    'queryFn' | 'queryKey' | 'enabled'
  >

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
