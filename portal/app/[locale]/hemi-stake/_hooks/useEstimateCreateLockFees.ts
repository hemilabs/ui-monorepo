import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { createErc20AllowanceStateOverride } from 'utils/erc20StateOverride'
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
  const { address, isConnected } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const data = encodeCreateLock({
    amount,
    lockDurationInSeconds,
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
    value: undefined,
  })

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
