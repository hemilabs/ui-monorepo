import { encodeInitiateWithdraw } from 'hemi-tunnel-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useL2BridgeAddress } from 'hooks/useL2BridgeAddress'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { EvmToken } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { Address, Chain } from 'viem'
import { useEstimateGas } from 'wagmi'

export const useEstimateWithdrawFees = function ({
  amount,
  enabled = true,
  fromToken,
  l1ChainId,
}: {
  amount: bigint
  enabled?: boolean
  fromToken: EvmToken
  l1ChainId: Chain['id']
}) {
  const l2BridgeAddress = useL2BridgeAddress(l1ChainId)
  const isNative = isNativeAddress(fromToken.address)
  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeInitiateWithdraw({
      amount,
      l2TokenAddress: isNative
        ? NativeTokenSpecialAddressOnL2
        : (fromToken.address as Address),
    }),
    query: { enabled },
    to: l2BridgeAddress,
    value: isNative ? amount : undefined,
  })

  return useEstimateFees({
    chainId: fromToken.chainId,
    enabled: gasUnits !== undefined,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
