import { usePortalEstimateFees } from 'hooks/usePortalEstimateFees'
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

  const { data: gasUnits } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
  })

  return usePortalEstimateFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    overEstimation: 1.5,
  })
}
