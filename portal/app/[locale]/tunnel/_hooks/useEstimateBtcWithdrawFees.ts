import { useQuery } from '@tanstack/react-query'
import {
  bitcoinTunnelManagerAddresses,
  encodeInitiateWithdrawal,
} from 'hemi-viem'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { HemiPublicClient, useHemiClient } from 'hooks/useHemiClient'
import { useEstimateGas } from 'wagmi'

async function getEncodeInitiateWithdrawal({
  amount,
  btcAddress,
  hemiClient,
}: {
  amount: bigint
  btcAddress: string
  hemiClient: HemiPublicClient
}) {
  const vaultIndex = await hemiClient.getVaultChildIndex()

  return encodeInitiateWithdrawal({
    amount,
    btcAddress,
    vaultIndex,
  })
}

export function useEstimateBtcWithdrawFees({
  amount,
  btcAddress,
  enabled = true,
  l2ChainId,
}: {
  btcAddress: string
  amount: bigint
  l2ChainId: number
  enabled?: boolean
}) {
  const hemiClient = useHemiClient()
  const bitcoinManagerAddresses = bitcoinTunnelManagerAddresses[l2ChainId]

  const { data: encodedData, isSuccess } = useQuery({
    enabled,
    queryFn: () =>
      getEncodeInitiateWithdrawal({ amount, btcAddress, hemiClient }),
    queryKey: [
      'encode-initiate-withdrawal',
      btcAddress,
      amount.toString(),
      l2ChainId,
    ],
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
    chainId: l2ChainId,
    enabled: gasSuccess,
    gasUnits,
    isGasUnitsError: isGasError,
    overEstimation: 1.5,
  })
}
