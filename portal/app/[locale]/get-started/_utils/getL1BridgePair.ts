import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { isAddressEqual } from 'viem'

export const getL1BridgePair = function (
  token: EvmToken,
  remoteNetworks: RemoteChain[],
) {
  const bridgeInfo = token.extensions?.bridgeInfo
  if (!bridgeInfo) {
    return null
  }

  const l1ChainIdStr = Object.keys(bridgeInfo)[0]
  if (!l1ChainIdStr) {
    return null
  }

  const l1ChainId = Number(l1ChainIdStr)
  const network = remoteNetworks.find(n => n.id === l1ChainId)
  if (!network) {
    return null
  }

  const bridgeAddress = bridgeInfo[l1ChainIdStr]?.tokenAddress
  const address =
    !bridgeAddress ||
    isAddressEqual(bridgeAddress, NativeTokenSpecialAddressOnL2)
      ? getNativeToken(l1ChainId).address
      : bridgeAddress

  return {
    address,
    networkName: network.name,
  }
}
