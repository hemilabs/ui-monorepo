import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
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

  const { data: gasUnits, isError } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
    value: undefined,
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
