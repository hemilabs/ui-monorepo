import { Address } from 'viem'

import { useWriteErc20, type MutationWithArgs } from './baseErc20'

type TransferFromArgs = { amount: bigint; sender: Address; recipient: Address }
type Options = MutationWithArgs<TransferFromArgs>

export const useTransferFrom = (
  erc20Address: Address,
  { args: { amount, recipient, sender }, query }: Options,
) =>
  useWriteErc20(
    erc20Address,
    'transferFrom',
    [sender, recipient, amount],
    query,
  )
