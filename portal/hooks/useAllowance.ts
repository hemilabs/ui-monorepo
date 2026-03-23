import {
  allowanceQueryKey,
  useAllowance as useAllowanceLib,
} from '@hemilabs/react-hooks/useAllowance'
import { type UseQueryOptions } from '@tanstack/react-query'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, type Chain, isAddress } from 'viem'
type Owner = Address
type Spender = Address

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
