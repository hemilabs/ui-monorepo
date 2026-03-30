import { encodeUnstake, stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { usePortalEstimateFees } from 'hooks/usePortalEstimateFees'
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

  const { data: gasUnits } = useEstimateGas({
    data: encodeUnstake({
      amount,
      tokenAddress: token.address as `0x${string}`,
    }),
    query: { enabled },
    to: bridgeAddress,
  })

  return usePortalEstimateFees({
    chainId: token.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    overEstimation: 1.5,
  })
}
