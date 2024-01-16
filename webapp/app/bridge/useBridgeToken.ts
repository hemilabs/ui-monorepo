import { parseEther } from 'viem'
import {
  useContractWrite,
  usePrepareContractWrite,
  usePrepareSendTransaction,
  useSendTransaction,
} from 'wagmi'

type Options = Pick<
  Parameters<typeof usePrepareSendTransaction>['0'],
  'enabled'
> & { amount: string }

const bridgeSmartContractAddress = process.env.NEXT_PUBLIC_BRIDGE_SMART_CONTRACT

export const useDepositNativeToken = function ({ amount, enabled }: Options) {
  const { config } = usePrepareSendTransaction({
    enabled,
    to: bridgeSmartContractAddress,
    value: parseEther(amount),
  })
  const { data, sendTransaction, status } = useSendTransaction(config)

  return {
    depositNativeToken: () => sendTransaction?.(),
    depositNativeTokenTxHash: data?.hash,
    status,
  }
}

export const useDepositToken = function ({ enabled }: Options) {
  const { config } = usePrepareContractWrite({
    enabled,
  })
  const { data, status, write } = useContractWrite(config)
  return {
    depositToken: write,
    depositTokenTxHash: data?.hash,
    status,
  }
}
