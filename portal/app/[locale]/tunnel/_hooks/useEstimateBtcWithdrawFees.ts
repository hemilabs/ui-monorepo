import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { useQuery } from '@tanstack/react-query'
import { bitcoinTunnelManagerAddresses } from 'hemi-viem'
import { encodeInitiateWithdrawal } from 'hemi-viem/actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
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

  const { data: gasUnits, isError: isGasError } = useEstimateGas({
    data: encodedData,
    query: { enabled: isSuccess && !!encodedData },
    to: bitcoinManagerAddresses,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: hemi.id,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(hemi.id),
    gasUnits,
    isGasUnitsError: isGasError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
