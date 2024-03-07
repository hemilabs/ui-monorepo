import { type Address, type ContractFunctionArgs } from 'viem'

import {
  useWriteErc20,
  type Erc20Abi,
  type WriteQueryOptions,
} from './baseErc20'

type TransferArgs = ContractFunctionArgs<Erc20Abi, 'nonpayable', 'transfer'>
type Recipient = TransferArgs[0]
type Amount = TransferArgs[1]

type Options = {
  args: { amount: Amount; recipient: Recipient }
  query?: WriteQueryOptions
}

export const useTransfer = (
  erc20Address: Address,
  { args: { amount, recipient }, query }: Options,
) =>
  useWriteErc20({
    address: erc20Address,
    args: [recipient, amount],
    functionName: 'transfer',
    query,
  })
