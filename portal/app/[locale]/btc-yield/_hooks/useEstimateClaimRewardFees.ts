import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { encodeClaimReward } from 'vault-rewards-actions/actions'
import { useAccount, useEstimateGas } from 'wagmi'

import { useVaultRewardsAddress } from './useVaultRewardsAddress'

export const useEstimateClaimRewardFees = function ({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const hemi = useHemi()
  const { address } = useAccount()
  const { data: vaultRewardsAddress } = useVaultRewardsAddress()

  const isEnabled = enabled && !!address && !!vaultRewardsAddress

  const { data: gasUnits, isError } = useEstimateGas({
    data: isEnabled
      ? encodeClaimReward({
          account: address!,
        })
      : undefined,
    query: { enabled: isEnabled },
    to: vaultRewardsAddress,
  })

  return useEstimateFees({
    chainId: hemi.id,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
