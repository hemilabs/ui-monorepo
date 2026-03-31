import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
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
