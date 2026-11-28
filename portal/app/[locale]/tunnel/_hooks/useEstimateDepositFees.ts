import { encodeDepositErc20, encodeDepositEth } from 'hemi-tunnel-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { EvmToken } from 'types/token'
import { getL1StandardBridgeAddress } from 'utils/chain'
import { createErc20AllowanceStateOverride } from 'utils/erc20StateOverride'
import { isNativeToken } from 'utils/nativeToken'
import { type Address } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateDepositFees = function ({
  amount,
  enabled = true,
  fromToken,
  to,
  toToken,
}: {
  amount: bigint
  enabled?: boolean
  fromToken: EvmToken
  to?: Address | undefined
  toToken: EvmToken
}) {
  const { address } = useAccount()
  const receiver = to ?? address

  const isNative = isNativeToken(fromToken)
  const l1StandardBridge = getL1StandardBridgeAddress(fromToken.chainId)
  const { data: gasUnits, isError } = useEstimateGas({
    chainId: fromToken.chainId,
    data: receiver
      ? isNative
        ? encodeDepositEth(receiver)
        : encodeDepositErc20({
            amount,
            // @ts-expect-error fromToken.address is Address
            l1TokenAddress: fromToken.address,
            // @ts-expect-error toToken.address is Address
            l2TokenAddress: toToken.address,
            to: receiver,
          })
      : undefined,
    query: { enabled: enabled && !!address },
    stateOverride: createErc20AllowanceStateOverride({
      enabled: !isNative,
      owner: address,
      spender: l1StandardBridge,
      token: fromToken,
    }),
    to: l1StandardBridge,
    value: isNative ? amount : undefined,
  })

  return useEstimateFees({
    chainId: fromToken.chainId,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
