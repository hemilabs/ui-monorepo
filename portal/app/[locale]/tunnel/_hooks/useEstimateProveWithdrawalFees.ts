import { useQuery } from '@tanstack/react-query'
import { prepareProveWithdrawal } from 'hemi-tunnel-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemiClient } from 'hooks/useHemiClient'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { Chain } from 'viem'
import { publicActionsL2 } from 'viem/op-stack'
import { useAccount } from 'wagmi'

export const useEstimateProveWithdrawalFees = function ({
  enabled = true,
  withdrawal,
}: {
  enabled?: boolean
  withdrawal: ToEvmWithdrawOperation
}) {
  const { l1ChainId, transactionHash } = withdrawal

  const { address: account } = useAccount()
  const hemiClient = useHemiClient()

  const {
    data: gasUnits,
    isError,
    isSuccess,
  } = useQuery({
    enabled,
    async queryFn() {
      const publicClient = getEvmL1PublicClient(l1ChainId)

      return prepareProveWithdrawal({
        account,
        hash: transactionHash,
        l1PublicClient: publicClient,
        l2PublicClient: hemiClient.extend(publicActionsL2()),
      }).then(proveArgs =>
        publicClient.estimateProveWithdrawalGas({
          chain: findChainById(l1ChainId) as Chain,
          ...proveArgs,
        }),
      )
    },
    queryKey: [
      'estimate-prove-withdrawal-gas-units',
      account,
      l1ChainId,
      transactionHash,
    ],
  })

  return useEstimateFees({
    chainId: l1ChainId,
    enabled: isSuccess,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
