import { erc20Abi, ContractFunctionArgs, ContractFunctionName } from 'viem'
import { type UseReadContractParameters, useReadContract } from 'wagmi'

export type Erc20Abi = typeof erc20Abi

export const useReadErc20 = <
  FunctionName extends ContractFunctionName<Erc20Abi, 'pure' | 'view'>,
  Args extends ContractFunctionArgs<Erc20Abi, 'pure' | 'view', FunctionName>,
>(
  params: UseReadContractParameters<Erc20Abi, FunctionName, Args>,
) =>
  useReadContract<Erc20Abi, FunctionName, Args>({
    abi: erc20Abi,
    ...params,
  })
