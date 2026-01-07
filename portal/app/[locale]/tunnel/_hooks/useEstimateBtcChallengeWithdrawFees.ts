import {
  bitcoinTunnelManagerAddresses,
  encodeChallengeWithdrawal,
} from 'hemi-viem'
import { useEstimateFees } from 'hooks/useEstimateFees'
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

  return useEstimateFees({
    chainId: l2ChainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
