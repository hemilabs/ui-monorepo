import { Address } from 'viem'

import { useWriteErc20, type MutationWithArgs } from './baseErc20'

type TransferArgs = { amount: bigint; recipient: Address }
type Options = MutationWithArgs<TransferArgs>

export const useTransfer = (
  erc20Address: Address,
  { args: { amount, recipient }, query }: Options,
) => useWriteErc20(erc20Address, 'transfer', [recipient, amount], query)
