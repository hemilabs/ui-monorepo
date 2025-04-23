import { useQueryClient } from '@tanstack/react-query'
import { GetBalanceReturnType } from '@wagmi/core'
import { useCallback } from 'react'
import { Chain, TransactionReceipt } from 'viem'

import { useNativeTokenBalance } from './useBalance'

export const useUpdateNativeBalanceAfterReceipt = function (
  chainId: Chain['id'],
) {
  const queryClient = useQueryClient()

  const { queryKey: nativeTokenBalanceQueryKey } =
    useNativeTokenBalance(chainId)

  return useCallback(
    (
      { effectiveGasPrice, gasUsed }: TransactionReceipt,
      amount: bigint = BigInt(0),
    ) =>
      queryClient.setQueryData(
        nativeTokenBalanceQueryKey,
        (old: GetBalanceReturnType) => ({
          ...old,
          value: old.value - effectiveGasPrice * gasUsed - amount,
        }),
      ),
    [queryClient, nativeTokenBalanceQueryKey],
  )
}
