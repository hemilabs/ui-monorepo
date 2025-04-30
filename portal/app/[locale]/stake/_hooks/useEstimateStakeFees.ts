import {
  encodeStakeErc20,
  encodeStakeEth,
  stakeManagerAddresses,
} from 'hemi-viem-stake-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakeToken } from 'types/stake'
import { isNativeToken } from 'utils/nativeToken'
import { Address } from 'viem'
import { useEstimateGas } from 'wagmi'

export const useEstimateStakeFees = function ({
  amount,
  enabled = true,
  forAccount,
  token,
}: {
  amount: bigint
  enabled?: boolean
  forAccount: Address
  token: StakeToken
}) {
  const isNative = isNativeToken(token)
  const bridgeAddress = stakeManagerAddresses[token.chainId]

  const data = isNative
    ? encodeStakeEth({ forAccount })
    : encodeStakeErc20({
        amount,
        forAccount,
        tokenAddress: token.address as `0x${string}`,
      })

  const { data: gasUnits, isSuccess } = useEstimateGas({
    data,
    query: { enabled },
    to: bridgeAddress,
    value: isNative ? amount : undefined,
  })

  return useEstimateFees({
    chainId: token.chainId,
    enabled: isSuccess,
    gasUnits,
    overEstimation: 1.5,
  })
}
