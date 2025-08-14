import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeCreateLock } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateCreateLockFees = function ({
  amount,
  enabled = true,
  lockDurationInSeconds,
  token,
}: {
  amount: bigint
  enabled?: boolean
  lockDurationInSeconds: bigint
  token: StakingDashboardToken
}) {
  const { isConnected } = useAccount()
  const bridgeAddress = getVeHemiContractAddress(token.chainId)

  const data = isConnected
    ? encodeCreateLock({
        amount,
        lockDurationInSeconds,
      })
    : undefined

  const { data: gasUnits, isSuccess } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: bridgeAddress,
    value: undefined,
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: isSuccess,
    gasUnits,
    overEstimation: 1.5,
  })
}
