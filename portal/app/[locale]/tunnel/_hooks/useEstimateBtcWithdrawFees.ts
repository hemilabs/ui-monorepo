import { useQuery } from '@tanstack/react-query'
import { bitcoinTunnelManagerAddresses } from 'hemi-viem'
import { encodeInitiateWithdrawal } from 'hemi-viem/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getVaultChildIndex } from 'utils/hemiClientExtraActions'
import { type PublicClient } from 'viem'
import { useEstimateGas } from 'wagmi'

async function getEncodeInitiateWithdrawal({
  amount,
  btcAddress,
  hemiClient,
}: {
  amount: bigint
  btcAddress: string
  hemiClient: PublicClient
}) {
  const vaultIndex = await getVaultChildIndex(hemiClient)

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
}: {
  amount: bigint
  btcAddress: string | undefined
  enabled?: boolean
}) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  const bitcoinManagerAddresses = bitcoinTunnelManagerAddresses[hemi.id]

  const { data: encodedData, isSuccess } = useQuery({
    enabled: enabled && !!btcAddress && !!hemiClient,
    queryFn: () =>
      getEncodeInitiateWithdrawal({
        amount,
        btcAddress: btcAddress!,
        hemiClient,
      }),
    queryKey: [
      'encode-initiate-withdrawal',
      btcAddress,
      amount.toString(),
      hemi.id,
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
    chainId: hemi.id,
    enabled: gasSuccess,
    gasUnits,
    isGasUnitsError: isGasError,
    overEstimation: 1.5,
  })
}
