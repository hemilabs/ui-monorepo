import { type Address, type ContractFunctionArgs } from 'viem'

import {
  useWriteErc20,
  type Erc20Abi,
  type WriteQueryOptions,
} from './baseErc20'

type ApproveArgs = ContractFunctionArgs<Erc20Abi, 'nonpayable', 'approve'>
type Spender = ApproveArgs[0]
type Amount = ApproveArgs[1]

type Options = {
  args: { amount: Amount; spender: Spender }
  mutation?: WriteQueryOptions
}

export const useApprove = (
  erc20Address: Address,
  { args: { amount, spender }, mutation }: Options,
) =>
  useWriteErc20({
    address: erc20Address,
    args: [spender, amount],
    functionName: 'approve',
    mutation,
  })
