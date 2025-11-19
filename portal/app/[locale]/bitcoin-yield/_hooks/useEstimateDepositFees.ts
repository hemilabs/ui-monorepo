import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { encodeDepositToken } from 'hemi-btc-staking-actions/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemiToken } from 'hooks/useHemiToken'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateDepositFees = function ({
  amount,
  enabled = true,
}: {
  amount: bigint
  enabled?: boolean
}) {
  const token = useHemiToken()
  const { address } = useAccount()
  const vaultAddress = getBtcStakingVaultContractAddress(token.chainId)

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

  return useEstimateFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
