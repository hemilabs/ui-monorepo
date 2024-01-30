import { Address } from 'viem'

import { useReadErc20, type QueryWithArgs } from './baseErc20'

type BalanceOfArgs = { account: Address }
type Options = QueryWithArgs<bigint, BalanceOfArgs>

export const useBalanceOf = (
  erc20Address: Address,
  { args: { account }, query }: Options,
) => useReadErc20(erc20Address, 'balanceOf', [account], query)
