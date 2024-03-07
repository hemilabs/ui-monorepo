import {
  erc20Abi,
  ContractFunctionArgs,
  ContractFunctionName,
  Address,
} from 'viem'
import {
  type UseReadContractParameters,
  useReadContract,
  useWriteContract,
  UseWriteContractParameters,
} from 'wagmi'

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

export type WriteQueryOptions = UseWriteContractParameters['mutation']

type WriteOptions<
  FunctionName extends ContractFunctionName<Erc20Abi, 'nonpayable' | 'payable'>,
  Args extends ContractFunctionArgs<
    Erc20Abi,
    'nonpayable' | 'payable',
    FunctionName
  >,
> = {
  address: Address
  args: Args
  functionName: FunctionName
} & { query?: UseWriteContractParameters['mutation'] }

export const useWriteErc20 = function <
  FunctionName extends ContractFunctionName<Erc20Abi, 'nonpayable' | 'payable'>,
  Args extends ContractFunctionArgs<
    Erc20Abi,
    'nonpayable' | 'payable',
    FunctionName
  >,
>({ address, args, functionName }: WriteOptions<FunctionName, Args>) {
  const { writeContract, writeContractAsync, ...rest } = useWriteContract()

  const writeParams = { abi: erc20Abi, address, args, functionName }
  return {
    writeContract: () => writeContract(writeParams),
    writeContractAsync: () => writeContractAsync(writeParams),
    ...rest,
  }
}
