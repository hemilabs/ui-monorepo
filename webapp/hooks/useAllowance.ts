import { useMemo } from 'react'
import { isNativeAddress } from 'utils/nativeToken'
import { type ContractFunctionArgs, erc20Abi, isAddress } from 'viem'
import { type UseReadContractParameters, useReadContract } from 'wagmi'

type AllowanceArgs = ContractFunctionArgs<typeof erc20Abi, 'view', 'allowance'>

type Owner = AllowanceArgs[0]
type Spender = AllowanceArgs[1]

type Options = {
  args: { owner: Owner; spender: Spender }
  query?: UseReadContractParameters<typeof erc20Abi, 'allowance'>['query']
}

export const useAllowance = (
  erc20Address: string,
  { args: { owner, spender }, query }: Options,
) =>
  useReadContract({
    abi: erc20Abi,
    // @ts-expect-error Will be enabled if erc20Address is address
    address: erc20Address,
    args: useMemo(() => [owner, spender], [owner, spender]),
    functionName: 'allowance',
    query: {
      ...query,
      enabled:
        isAddress(erc20Address) &&
        !isNativeAddress(erc20Address) &&
        !!owner &&
        !!spender &&
        query?.enabled !== false,
    },
  })
