import { encodeInitiateWithdraw } from 'hemi-tunnel-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { EvmToken } from 'types/token'
import { getL2BridgeAddress } from 'utils/chain'
import { isNativeAddress } from 'utils/nativeToken'
import { Address, Chain } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

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
  const { address } = useAccount()

  const l2BridgeAddress = getL2BridgeAddress(l1ChainId)
  const isNative = isNativeAddress(fromToken.address)
  const { data: gasUnits, isError } = useEstimateGas({
    data: address
      ? encodeInitiateWithdraw({
          amount,
          l2TokenAddress: isNative
            ? NativeTokenSpecialAddressOnL2
            : (fromToken.address as Address),
          to: address,
        })
      : undefined,
    query: { enabled: enabled && !!address },
    to: l2BridgeAddress,
    value: isNative ? amount : undefined,
  })

  return useEstimateFees({
    chainId: fromToken.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
