import { useQuery } from '@tanstack/react-query'
import { bitcoinTunnelManagerAddresses, encodeConfirmDeposit } from 'hemi-viem'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { HemiPublicClient, useHemiClient } from 'hooks/useHemiClient'
import { BtcDepositOperation } from 'types/tunnel'
import { calculateDepositOutputIndex } from 'utils/bitcoin'
import { createBtcApi, mapBitcoinNetwork } from 'utils/btcApi'
import { getVaultIndexByBTCAddress } from 'utils/hemiMemoized'
import { useEstimateGas } from 'wagmi'

async function getEncodedConfirmDeposit({
  deposit,
  hemiClient,
}: {
  deposit: BtcDepositOperation
  hemiClient: HemiPublicClient
}) {
  const vaultIndex = await getVaultIndexByBTCAddress(hemiClient, deposit)

  const btcApi = createBtcApi(mapBitcoinNetwork(deposit.l1ChainId))
  const receipt = await btcApi.getTransactionReceipt(deposit.transactionHash)
  const outputIndex = await calculateDepositOutputIndex(receipt!, deposit.to)

  return encodeConfirmDeposit({
    extraInfo: '0x',
    outputIndex: BigInt(outputIndex),
    txId: deposit.transactionHash,
    vaultIndex,
  })
}

export function useEstimateBtcDepositFees({
  deposit,
  enabled = true,
}: {
  deposit: BtcDepositOperation
  enabled?: boolean
}) {
  const hemiClient = useHemiClient()
  const bitcoinManagerAddresses =
    bitcoinTunnelManagerAddresses[deposit.l2ChainId]

  const { data: encodedData, isSuccess } = useQuery({
    enabled: !!deposit && enabled,
    queryFn: () => getEncodedConfirmDeposit({ deposit, hemiClient }),
    queryKey: ['encode-confirm-deposit', deposit.transactionHash],
  })

  const {
    data: gasUnits,
    isError: isGasError,
    isSuccess: gasSuccess,
  } = useEstimateGas({
    data: encodedData,
    query: { enabled: isSuccess && !!encodedData },
    to: bitcoinManagerAddresses,
  })

  return useEstimateFees({
    chainId: deposit.l2ChainId,
    enabled: gasSuccess,
    gasUnits,
    isGasUnitsError: isGasError,
    overEstimation: 1.5,
  })
}
