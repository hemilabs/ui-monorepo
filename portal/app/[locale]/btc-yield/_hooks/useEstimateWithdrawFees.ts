import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { encodeWithdraw } from 'hemi-btc-staking-actions/actions'
import { useHemi } from 'hooks/useHemi'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
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

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: hemi.id,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(hemi.id),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
