import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import {
  encodeStakeErc20,
  encodeStakeEth,
  stakeManagerAddresses,
} from 'hemi-viem-stake-actions'
import { StakeToken } from 'types/stake'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { isNativeToken } from 'utils/nativeToken'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateStakeFees = function ({
  amount,
  enabled = true,
  token,
}: {
  amount: bigint
  enabled?: boolean
  token: StakeToken
}) {
  const { address: forAccount } = useAccount()
  const isNative = isNativeToken(token)
  const bridgeAddress = stakeManagerAddresses[token.chainId]

  const data = forAccount
    ? isNative
      ? encodeStakeEth({ forAccount })
      : encodeStakeErc20({
          amount,
          forAccount,
          tokenAddress: token.address as `0x${string}`,
        })
    : undefined

  const { data: gasUnits, isError } = useEstimateGas({
    data,
    query: { enabled: forAccount && enabled },
    to: bridgeAddress,
    value: isNative ? amount : undefined,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: token.chainId,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(token.chainId),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
