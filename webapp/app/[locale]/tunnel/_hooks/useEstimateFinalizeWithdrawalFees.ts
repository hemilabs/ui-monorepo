import { useQuery } from '@tanstack/react-query'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { getEvmTransactionReceipt } from 'utils/evmApi'
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

  const { data: gasUnits, isSuccess } = useQuery({
    enabled,
    async queryFn() {
      const publicClient = getEvmL1PublicClient(l1ChainId)
      return getEvmTransactionReceipt(transactionHash, l2ChainId)
        .then(receipt => getWithdrawals(receipt))
        .then(([w]) =>
          publicClient.estimateFinalizeWithdrawalGas({
            account,
            // @ts-expect-error Can't make the viem types to work. This works on runtime
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

  return useEstimateFees({
    chainId: l1ChainId,
    enabled: isSuccess,
    gasUnits,
    overEstimation: 1.5,
  })
}
