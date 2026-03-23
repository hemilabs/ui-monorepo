import {
  allowanceQueryKey,
  useAllowance as useAllowanceLib,
} from '@hemilabs/react-hooks/useAllowance'
import { type UseQueryOptions } from '@tanstack/react-query'
import { isNativeAddress } from 'utils/nativeToken'
import {
  type Address,
  Chain,
  type ContractFunctionArgs,
  erc20Abi,
  isAddress,
} from 'viem'
type AllowanceArgs = ContractFunctionArgs<typeof erc20Abi, 'view', 'allowance'>

type Owner = AllowanceArgs[0]
type Spender = AllowanceArgs[1]

// The lib omits `enabled` from its query type signature but supports it at
// runtime via object spread. This type reinstates it explicitly.
type AllowanceQuery = Omit<
  UseQueryOptions<bigint, Error, bigint>,
  'queryFn' | 'queryKey'
>

type Options = {
  args: { owner: Owner | undefined; spender: Spender | undefined }
  query?: AllowanceQuery
  chainId: Chain['id']
}

export const useAllowance = (
  erc20Address: string,
  { args: { owner, spender }, chainId, query }: Options,
) => ({
  ...useAllowanceLib<bigint>({
    owner,
    query: {
      ...query,
      enabled:
        isAddress(erc20Address) &&
        !isNativeAddress(erc20Address) &&
        !!owner &&
        !!spender &&
        query?.enabled !== false,
    } as AllowanceQuery,
    spender,
    token: { address: erc20Address as Address, chainId },
  }),
  queryKey: allowanceQueryKey({
    owner,
    spender,
    token: { address: erc20Address as Address, chainId },
  }),
})
