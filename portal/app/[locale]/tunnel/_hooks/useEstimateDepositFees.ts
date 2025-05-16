import { encodeDepositErc20, encodeDepositEth } from 'hemi-tunnel-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useL1StandardBridgeAddress } from 'hooks/useL1StandardBridgeAddress'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { useEstimateGas } from 'wagmi'

export const useEstimateDepositFees = function ({
  amount,
  enabled = true,
  fromToken,
  toToken,
}: {
  amount: bigint
  enabled?: boolean
  fromToken: EvmToken
  toToken: EvmToken
}) {
  const isNative = isNativeToken(fromToken)
  const l1StandardBridge = useL1StandardBridgeAddress(fromToken.chainId)
  const {
    data: gasUnits,
    isError,
    isSuccess,
  } = useEstimateGas({
    data: isNative
      ? encodeDepositEth()
      : encodeDepositErc20({
          amount,
          // @ts-expect-error fromToken.address is Address
          l1TokenAddress: fromToken.address,
          // @ts-expect-error toToken.address is Address
          l2TokenAddress: toToken.address,
        }),
    query: { enabled },
    to: l1StandardBridge,
    value: isNative ? amount : undefined,
  })

  return useEstimateFees({
    chainId: fromToken.chainId,
    enabled: isSuccess,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
