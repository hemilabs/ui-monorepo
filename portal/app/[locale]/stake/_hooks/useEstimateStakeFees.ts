import {
  encodeStakeErc20,
  encodeStakeEth,
  stakeManagerAddresses,
} from 'hemi-viem-stake-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { StakeToken } from 'types/stake'
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

  const { data: gasUnits, isSuccess } = useEstimateGas({
    data,
    query: { enabled: forAccount && enabled },
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
