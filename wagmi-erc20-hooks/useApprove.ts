import { type Address, type ContractFunctionArgs, erc20Abi } from 'viem'
import {
  useAccount,
  useWriteContract,
  type UseWriteContractParameters,
} from 'wagmi'

import { type Erc20Abi } from './baseErc20'

type ApproveArgs = ContractFunctionArgs<Erc20Abi, 'nonpayable', 'approve'>
type Spender = ApproveArgs[0]
type Amount = ApproveArgs[1]

type Options = {
  args: { amount: Amount; spender: Spender }
  mutation?: UseWriteContractParameters['mutation']
}

export const useApprove = function (
  erc20Address: Address,
  { args: { amount, spender }, mutation }: Options,
) {
  const { address, chain } = useAccount()
  const { writeContract, writeContractAsync, ...rest } = useWriteContract({
    mutation,
  })

  return {
    writeContract: () =>
      writeContract({
        abi: erc20Abi,
        account: address,
        address: erc20Address,
        args: [spender, amount],
        chain,
        functionName: 'approve',
      }),
    ...rest,
  }
}
