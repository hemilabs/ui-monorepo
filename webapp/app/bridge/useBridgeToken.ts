import { parseEther } from 'viem'
import {
  useContractWrite,
  usePrepareContractWrite,
  usePrepareSendTransaction,
  useSendTransaction,
} from 'wagmi'

type UseDepositNativeToken = Pick<
  Parameters<typeof usePrepareSendTransaction>['0'],
  'enabled'
> & { amount: string }

export const useDepositNativeToken = function ({
  amount,
  ...options
}: UseDepositNativeToken) {
  const { config } = usePrepareSendTransaction({
    to: process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE,
    value: parseEther(amount),
    ...options,
  })
  const { data, sendTransaction, status } = useSendTransaction(config)

  return {
    depositNativeToken: () => sendTransaction?.(),
    depositNativeTokenTxHash: data?.hash,
    status,
  }
}

type UseDepositToken = Pick<
  Parameters<typeof usePrepareContractWrite>['0'],
  'enabled'
>
export const useDepositToken = function (options: UseDepositToken) {
  const { config } = usePrepareContractWrite(options)
  const { data, status, write } = useContractWrite(config)
  return {
    depositToken: write,
    depositTokenTxHash: data?.hash,
    status,
  }
}
