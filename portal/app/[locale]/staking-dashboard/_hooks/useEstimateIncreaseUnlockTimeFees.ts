import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeIncreaseUnlockTime } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

import { daysToSeconds } from '../_utils/lockCreationTimes'

export const useEstimateIncreaseUnlockTimeFees = function ({
  enabled = true,
  lockupDays,
  token,
  tokenId,
}: {
  enabled?: boolean
  lockupDays: number
  token: StakingDashboardToken
  tokenId: bigint
}) {
  const { isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeIncreaseUnlockTime({
    lockDurationInSeconds: daysToSeconds(BigInt(lockupDays)),
    tokenId,
  })

  const { data: gasUnits, isError } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: token.chainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(token.chainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
