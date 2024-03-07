import { useMemo } from 'react'
import { type Address, type ContractFunctionArgs } from 'viem'
import { type UseReadContractParameters } from 'wagmi'

import { useReadErc20, type Erc20Abi } from './baseErc20'

type AllowanceArgs = ContractFunctionArgs<Erc20Abi, 'view', 'allowance'>

type Owner = AllowanceArgs[0]
type Spender = AllowanceArgs[1]

type Options = {
  args: { owner: Owner; spender: Spender }
  query?: UseReadContractParameters<Erc20Abi, 'allowance'>['query']
}

export const useAllowance = (
  erc20Address: Address,
  { args: { owner, spender }, query }: Options,
) =>
  useReadErc20({
    address: erc20Address,
    args: useMemo(() => [owner, spender], [owner, spender]),
    functionName: 'allowance',
    query,
  })
