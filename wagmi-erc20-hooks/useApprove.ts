import { Address } from 'viem'

import { useWriteErc20, type MutationWithArgs } from './baseErc20'

type ApproveArgs = { amount: bigint; spender: Address }
type Options = MutationWithArgs<ApproveArgs>

export const useApprove = (
  erc20Address: Address,
  { args: { amount, spender }, query }: Options,
) => useWriteErc20(erc20Address, 'approve', [spender, amount], query)
