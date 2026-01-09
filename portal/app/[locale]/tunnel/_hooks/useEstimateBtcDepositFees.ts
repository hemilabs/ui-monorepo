import { useQuery } from '@tanstack/react-query'
import { bitcoinTunnelManagerAddresses } from 'hemi-viem'
import { encodeConfirmDeposit } from 'hemi-viem/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemiClient } from 'hooks/useHemiClient'
import { BtcDepositOperation } from 'types/tunnel'
import { calculateDepositOutputIndex } from 'utils/bitcoin'
import { createBtcApi, mapBitcoinNetwork } from 'utils/btcApi'
import { getVaultIndexByBTCAddress } from 'utils/hemiMemoized'
import { type PublicClient } from 'viem'
import { useEstimateGas } from 'wagmi'

async function getEncodedConfirmDeposit({
  deposit,
  hemiClient,
}: {
  deposit: BtcDepositOperation
  hemiClient: PublicClient
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

  const { data: gasUnits, isError: isGasError } = useEstimateGas({
    data: encodedData,
    query: { enabled: isSuccess && !!encodedData },
    to: bitcoinManagerAddresses,
  })

  return useEstimateFees({
    chainId: deposit.l2ChainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isGasError,
    overEstimation: 1.5,
  })
}
