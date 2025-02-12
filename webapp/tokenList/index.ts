import hemilabsTokenList from '@hemilabs/token-list'
import { featureFlags } from 'app/featureFlags'
import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { type EvmToken, type Token } from 'types/token'
import { type Address } from 'viem'

export const getRemoteTokens = function (token: EvmToken) {
  if (!token.extensions?.bridgeInfo) {
    return [] satisfies EvmToken[]
  }
  return Object.keys(token.extensions!.bridgeInfo!).map(l1ChainId => ({
    ...token,
    address: token.extensions!.bridgeInfo![l1ChainId].tokenAddress,
    chainId: Number(l1ChainId),
    extensions: {
      bridgeInfo: {
        [token.chainId]: {
          tokenAddress: token.address as Address,
        },
      },
    },
    name: token.name
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
    symbol: token.symbol
      // Remove the ".e" suffix
      .replace('.e', '')
      .trim(),
  })) satisfies EvmToken[]
}

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const ethLogoUri =
  'https://raw.githubusercontent.com/hemilabs/token-list/master/src/logos/eth.svg'

const hemiTokens: Token[] = (hemilabsTokenList.tokens as EvmToken[])
  .filter(t => t.chainId === hemiMainnet.id || t.chainId === hemiTestnet.id)
  // WETH cannot be tunneled, so we must exclude it
  .filter(t => t.symbol !== 'WETH')
  // TODO the following line once bitcoin is enabled https://github.com/hemilabs/ui-monorepo/issues/738
  .filter(t => t.symbol !== 'tBTC' || featureFlags.btcTunnelEnabled)
  .map(t => ({ ...t, symbol: t.symbol.replace('.e', '').trim() }))

// the hemiTokens only contains definitions for Hemi tokens, but we can create the L1 version with the extensions field info
const tokens: Token[] = hemiTokens.concat(hemiTokens.flatMap(getRemoteTokens))

const nativeTokens: Token[] = [
  {
    address: mainnet.nativeCurrency.symbol,
    chainId: mainnet.id,
    decimals: mainnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address for native ETH in hemi
        [hemiMainnet.id]: {},
      },
    },
    logoURI: ethLogoUri,
    name: mainnet.nativeCurrency.name,
    symbol: mainnet.nativeCurrency.symbol,
  },
  {
    address: sepolia.nativeCurrency.symbol,
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address for native ETH in hemi
        [hemiTestnet.id]: {},
      },
    },
    logoURI: ethLogoUri,
    name: sepolia.nativeCurrency.name,
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: hemiMainnet.nativeCurrency.symbol,
    chainId: hemiMainnet.id,
    decimals: hemiMainnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [mainnet.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    logoURI: ethLogoUri,
    name: hemiMainnet.nativeCurrency.name,
    symbol: hemiMainnet.nativeCurrency.symbol,
  },
  {
    address: hemiTestnet.nativeCurrency.symbol,
    chainId: hemiTestnet.id,
    decimals: hemiTestnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    logoURI: ethLogoUri,
    name: hemiTestnet.nativeCurrency.name,
    symbol: hemiTestnet.nativeCurrency.symbol,
  },
]

if (featureFlags.btcTunnelEnabled) {
  const btcToken = tokens.find(
    t => t.chainId === hemiTestnet.id && t.symbol === 'tBTC',
  )

  nativeTokens.push({
    address: btcToken.symbol,
    chainId: bitcoinTestnet.id,
    decimals: btcToken.decimals,
    extensions: {
      bridgeInfo: {
        [hemiTestnet.id]: {
          tokenAddress: btcToken.address as Address,
        },
      },
    },
    logoURI: btcToken.logoURI,
    name: btcToken.name,
    symbol: btcToken.symbol,
  })
}

export const tokenList = {
  name: hemilabsTokenList.name,
  tags: {},
  timestamp: hemilabsTokenList.timestamp,
  tokens: tokens
    .concat(nativeTokens)
    .sort((a, b) => a.symbol.localeCompare(b.symbol)),
}
