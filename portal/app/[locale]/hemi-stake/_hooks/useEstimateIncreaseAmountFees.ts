import { useEstimateFees } from 'hooks/useEstimateFees'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { encodeIncreaseAmount } from 've-hemi-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

import { createErc20AllowanceStateOverride } from '../_utils/erc20StateOverride'

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
  const { address, isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeIncreaseAmount({
    amount,
    tokenId,
  })

  const { data: gasUnits, isError } = useEstimateGas({
    chainId: token.chainId,
    data,
    query: { enabled: isConnected && enabled },
    stateOverride: createErc20AllowanceStateOverride({
      owner: address,
      spender: veHemiAddress,
      token,
    }),
    to: veHemiAddress,
  })

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
