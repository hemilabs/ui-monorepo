import { Address } from 'viem'
import {
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi'

import { erc20Abi, type Erc20Abi } from './erc20Abi'

type Args = readonly unknown[]

export type QueryOptions<ReturnType> = Pick<
  Parameters<
    typeof useContractRead<Erc20Abi, string, ReturnType | undefined>
  >['0'],
  | 'cacheTime'
  | 'enabled'
  | 'isDataEqual'
  | 'select'
  | 'staleTime'
  | 'structuralSharing'
  | 'suspense'
  | 'onError'
  | 'onSettled'
  | 'onSuccess'
  | 'watch'
>

export type QueryWithArgs<ReturnType, A> = {
  args: A
  query?: QueryOptions<ReturnType>
}

export const useReadErc20 = <ReturnType>(
  erc20Address: Address,
  method: string,
  args?: Args,
  queryOptions: QueryOptions<ReturnType> = {},
) =>
  useContractRead<Erc20Abi, string, ReturnType | undefined>({
    abi: erc20Abi,
    address: erc20Address,
    args,
    functionName: method,
    // once migrated to wagmi v2, queryOptions will go into "query" prop
    // See https://wagmi.sh/react/guides/migrate-from-v1-to-v2#moved-tanstack-query-parameters-to-query-property
    ...queryOptions,
  })

type MutationOptions =
  // missing in types in usePrepareContractWrite, but it is an option according to docs
  // See https://1.x.wagmi.sh/react/prepare-hooks/usePrepareContractWrite#gas-optional
  { gas?: bigint } & Pick<
    Parameters<typeof usePrepareContractWrite<Erc20Abi, string, number>>['0'],
    | 'cacheTime'
    | 'enabled'
    | 'isDataEqual'
    | 'staleTime'
    | 'structuralSharing'
    | 'suspense'
    | 'onError'
    | 'onSettled'
    | 'onSuccess'
  >

export type MutationWithArgs<MutationArgs> = {
  args: MutationArgs
  query?: MutationOptions
}

export const useWriteErc20 = function <A extends Args>(
  erc20Address: Address,
  method: string,
  args?: A,
  mutationOptions: MutationOptions = {},
) {
  const { config } = usePrepareContractWrite<Erc20Abi, string, number>({
    abi: erc20Abi,
    address: erc20Address,
    args,
    functionName: method,
    // once migrated to wagmi v2, queryOptions will go into "query" prop
    // See https://wagmi.sh/react/guides/migrate-from-v1-to-v2#moved-tanstack-query-parameters-to-query-property
    ...mutationOptions,
  })
  return useContractWrite(config)
}
