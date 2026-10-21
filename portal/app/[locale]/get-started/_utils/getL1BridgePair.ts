import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { getTunnelPairs } from 'utils/tunnelPairs'
import { isAddress, isAddressEqual } from 'viem'

export const getL1BridgePair = function (
  token: EvmToken,
  remoteNetworks: RemoteChain[],
) {
  const pairs = getTunnelPairs(token.extensions)
  if (!pairs) {
    return null
  }

  const network = Object.keys(pairs)
    .map(chainId => remoteNetworks.find(n => n.id.toString() === chainId))
    .find(n => n !== undefined)
  if (!network) {
    return null
  }

  const bridgeAddress = pairs[network.id.toString()]?.tokenAddress
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
