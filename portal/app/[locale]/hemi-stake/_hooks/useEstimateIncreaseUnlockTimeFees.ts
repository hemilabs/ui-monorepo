import { useEstimateFees } from 'hooks/useEstimateFees'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeIncreaseUnlockTime } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

import { wholeDaysToSeconds } from '../_utils/lockCreationTimes'

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
    lockDurationInSeconds: wholeDaysToSeconds(lockupDays),
    tokenId,
  })

  const { data: gasUnits, isError } = useEstimateGas({
    chainId: token.chainId,
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
  })

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
