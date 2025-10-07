import { useEstimateFees } from 'hooks/useEstimateFees'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeIncreaseAmount } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateIncreaseAmountFees = function ({
  amount,
  enabled = true,
  token,
  tokenId,
}: {
  amount: bigint
  enabled?: boolean
  token: StakingDashboardToken
  tokenId: bigint
}) {
  const { isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeIncreaseAmount({
    amount,
    tokenId,
  })

  const { data: gasUnits } = useEstimateGas({
    data,
    query: { enabled: isConnected && enabled },
    to: veHemiAddress,
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    overEstimation: 1.5,
  })
}
