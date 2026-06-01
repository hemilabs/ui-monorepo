import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { isAddress, isAddressEqual } from 'viem'

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

  const network = remoteNetworks.find(n => n.id.toString() === l1ChainIdStr)
  if (!network) {
    return null
  }

  const bridgeAddress = bridgeInfo[l1ChainIdStr]?.tokenAddress
  // tokenAddress may not be a real 0x address (e.g. "BTC" for Bitcoin-backed
  // tokens), so guard isAddressEqual to avoid throwing during render.
  const isNativeEthOnL2 =
    !!bridgeAddress &&
    isAddress(bridgeAddress) &&
    isAddressEqual(bridgeAddress, NativeTokenSpecialAddressOnL2)
  const address =
    !bridgeAddress || isNativeEthOnL2
      ? getNativeToken(network.id).address
      : bridgeAddress

  return {
    address,
    networkName: network.name,
  }
}
