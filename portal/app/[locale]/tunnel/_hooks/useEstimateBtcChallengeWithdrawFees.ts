import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { bitcoinTunnelManagerAddresses } from 'hemi-viem'
import { encodeChallengeWithdrawal } from 'hemi-viem/actions'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { useEstimateGas } from 'wagmi'

export function useEstimateChallengeBtcWithdrawFees({
  enabled = true,
  l2ChainId,
  uuid,
}: {
  enabled?: boolean
  l2ChainId: number
  uuid: bigint
}) {
  const bitcoinManagerAddresses = bitcoinTunnelManagerAddresses[l2ChainId]

  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeChallengeWithdrawal({
      extraInfo: '0x',
      uuid,
    }),
    query: { enabled },
    to: bitcoinManagerAddresses,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: l2ChainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(l2ChainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
