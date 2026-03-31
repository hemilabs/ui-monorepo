import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { type Chain } from 'viem'
import { getWithdrawals } from 'viem/op-stack'
import { useAccount } from 'wagmi'

export const useEstimateFinalizeWithdrawalFees = function ({
  enabled = true,
  withdrawal,
}: {
  enabled?: boolean
  withdrawal: ToEvmWithdrawOperation
}) {
  const { l1ChainId, l2ChainId, transactionHash } = withdrawal

  const { address: account } = useAccount()
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  const { data: gasUnits, isError } = useQuery({
    enabled: enabled && !!account,
    async queryFn() {
      const publicClient = getEvmL1PublicClient(l1ChainId)
      return hemiClient
        .getTransactionReceipt({ hash: transactionHash })
        .then(receipt => getWithdrawals(receipt))
        .then(([w]) =>
          publicClient.estimateFinalizeWithdrawalGas({
            account: account!,
            // Chain is correctly defined, but getWithdrawalStatus expects a more strict
            // definition of Chain.
            // @ts-expect-error This works on runtime
            targetChain: hemi as Chain,
            withdrawal: w,
          }),
        )
    },
    queryKey: [
      'estimate-finalize-withdrawal-gas-units',
      account,
      l1ChainId,
      l2ChainId,
      transactionHash,
    ],
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: l1ChainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(l1ChainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
