import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { encodeWithdraw } from 'hemi-btc-staking-actions/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useAccount, useEstimateGas } from 'wagmi'

import { useConvertToShares } from './useConvertToShares'

export const useEstimateWithdrawFees = function ({
  assets,
  enabled = true,
}: {
  assets: bigint
  enabled?: boolean
}) {
  const hemi = useHemi()
  const { address } = useAccount()
  const vaultAddress = getBtcStakingVaultContractAddress(hemi.id)

  const isEnabled = enabled && !!address && assets > BigInt(0)

  const { data: shares } = useConvertToShares({
    assets,
    enabled: isEnabled,
  })

  const { data: gasUnits, isError } = useEstimateGas({
    data:
      isEnabled && shares !== undefined
        ? encodeWithdraw({
            owner: address,
            receiver: address,
            shares,
          })
        : undefined,
    query: {
      enabled: isEnabled && shares !== undefined,
    },
    to: vaultAddress,
  })

  return useEstimateFees({
    chainId: hemi.id,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
