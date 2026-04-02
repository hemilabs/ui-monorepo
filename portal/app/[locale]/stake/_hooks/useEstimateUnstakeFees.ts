import { encodeUnstake, stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakeToken } from 'types/stake'
import { useEstimateGas } from 'wagmi'

export const useEstimateUnstakeFees = function ({
  amount,
  enabled = true,
  token,
}: {
  amount: bigint
  enabled?: boolean
  token: StakeToken
}) {
  const bridgeAddress = stakeManagerAddresses[token.chainId]

  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeUnstake({
      amount,
      tokenAddress: token.address as `0x${string}`,
    }),
    query: { enabled },
    to: bridgeAddress,
  })

  return useEstimateFees({
    chainId: token.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
