import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { encodeDepositToken } from 'hemi-btc-staking-actions/actions'
import { useHemi } from 'hooks/useHemi'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateDepositFees = function ({
  amount,
  enabled = true,
}: {
  amount: bigint
  enabled?: boolean
}) {
  const hemi = useHemi()
  const { address } = useAccount()
  const vaultAddress = getBtcStakingVaultContractAddress(hemi.id)

  const isEnabled = enabled && !!address && amount > BigInt(0)

  const { data: gasUnits, isError } = useEstimateGas({
    data: isEnabled
      ? encodeDepositToken({
          amount,
          receiver: address,
        })
      : undefined,
    query: {
      enabled: isEnabled,
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
