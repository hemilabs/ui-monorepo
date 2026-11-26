import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeToggleAutoRelock } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateToggleAutoRelockFees = function ({
  enable,
  enabled = true,
  token,
  tokenId,
}: {
  enable: boolean
  enabled?: boolean
  token: StakingDashboardToken
  tokenId: bigint
}) {
  const { isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeToggleAutoRelock({
    enable,
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
