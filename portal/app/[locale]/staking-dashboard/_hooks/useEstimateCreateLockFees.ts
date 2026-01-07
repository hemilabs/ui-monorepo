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
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeCreateLock({
    amount,
    lockDurationInSeconds,
  })

  const { data: gasUnits } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
    value: undefined,
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    overEstimation: 1.5,
  })
}
