import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeWithdraw } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateWithdrawFees = function ({
  enabled = true,
  token,
  tokenId,
}: {
  enabled?: boolean
  token: StakingDashboardToken
  tokenId: bigint
}) {
  const { isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeWithdraw({
    tokenId,
  })

  const { data: gasUnits, isSuccess } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
    value: undefined,
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: isSuccess,
    gasUnits,
    overEstimation: 1.5,
  })
}
