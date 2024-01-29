import { Address } from 'viem'

import { useReadErc20, type QueryWithArgs } from './baseErc20'

type AllowanceArgs = { owner: Address; spender: Address }
type Options = QueryWithArgs<bigint, AllowanceArgs>

export const useAllowance = (
  erc20Address: Address,
  { args: { owner, spender }, query }: Options,
) => useReadErc20(erc20Address, 'allowance', [owner, spender], query)
