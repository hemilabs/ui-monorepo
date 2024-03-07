import { type Address, type ContractFunctionArgs } from 'viem'

import {
  useWriteErc20,
  type Erc20Abi,
  type WriteQueryOptions,
} from './baseErc20'

type TransferArgs = ContractFunctionArgs<Erc20Abi, 'nonpayable', 'transferFrom'>
type Sender = TransferArgs[0]
type Recipient = TransferArgs[1]
type Amount = TransferArgs[2]

type Options = {
  args: { amount: Amount; recipient: Recipient; sender: Sender }
  query?: WriteQueryOptions
}

export const useTransferFrom = (
  erc20Address: Address,
  { args: { amount, recipient, sender }, query }: Options,
) =>
  useWriteErc20({
    address: erc20Address,
    args: [sender, recipient, amount],
    functionName: 'transferFrom',
    query,
  })
