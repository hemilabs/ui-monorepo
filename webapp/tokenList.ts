import hemilabsTokenList from '@hemilabs/token-list'
import { featureFlags } from 'app/featureFlags'
import { bitcoinTestnet } from 'btc-wallet/chains'
import { inlineBtcLogo } from 'components/icons/btcLogo'
import { inlineEthLogo } from 'components/icons/ethLogo'
import { hemi as hemiMainnet, hemiSepolia } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { type EvmToken, type Token } from 'types/token'
import { Address } from 'viem'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const hemiTokens: Token[] = (hemilabsTokenList.tokens as EvmToken[])
  .filter(t => t.chainId === hemiMainnet.id || t.chainId === hemiSepolia.id)
  // WETH cannot be tunneled, so we must exclude it
  .filter(t => t.symbol !== 'WETH')

// the hemiTokens only contains definitions for Hemi tokens, but we can create the L1 version with the extensions field info
const l1HemiTokens = hemiTokens
  .filter(t => !!t.extensions?.bridgeInfo)
  .flatMap(t =>
    Object.keys(t.extensions!.bridgeInfo!).map(l1ChainId => ({
      ...t,
      address: t.extensions!.bridgeInfo![l1ChainId].tokenAddress,
      chainId: Number(l1ChainId),
      extensions: {
        bridgeInfo: {
          [t.chainId]: {
            tokenAddress: t.address as Address,
          },
        },
      },
      name: t.name,
      symbol: t.symbol
        // Remove the ".e" suffix
        .replace('.e', '')
        .trim(),
    })),
  )

const tokens: Token[] = hemiTokens.concat(l1HemiTokens)

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
    logoURI: inlineEthLogo,
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
        [hemiSepolia.id]: {},
      },
    },
    logoURI: inlineEthLogo,
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
    name: hemiMainnet.nativeCurrency.name,
    symbol: hemiMainnet.nativeCurrency.symbol,
  },
  {
    address: hemiSepolia.nativeCurrency.symbol,
    chainId: hemiSepolia.id,
    decimals: hemiSepolia.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    name: hemiSepolia.nativeCurrency.name,
    symbol: hemiSepolia.nativeCurrency.symbol,
  },
]

if (featureFlags.btcTunnelEnabled) {
  // TODO needs to be added to the token list https://github.com/hemilabs/ui-monorepo/issues/356
  const btcTokenAddress = '0x1b70FbDf46EB3e0AD5B34706d1984dc7e0265907'
  nativeTokens.push({
    address: bitcoinTestnet.nativeCurrency.symbol,
    chainId: bitcoinTestnet.id,
    decimals: bitcoinTestnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [hemiSepolia.id]: {
          tokenAddress: btcTokenAddress,
        },
      },
    },
    logoURI: inlineBtcLogo,
    name: bitcoinTestnet.name,
    symbol: bitcoinTestnet.nativeCurrency.symbol,
  })
  tokens.push({
    address: btcTokenAddress,
    chainId: hemiSepolia.id,
    decimals: 8,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address to bridge to in bitcoin
        // but we use this field to know the erc20 token address of btc in Hemi can be tunneled
        // to the Bitcoin network
        [bitcoinTestnet.id]: {},
      },
    },
    logoURI: inlineBtcLogo,
    name: bitcoinTestnet.name,
    symbol: bitcoinTestnet.nativeCurrency.symbol,
  })
}

export const tokenList = {
  keywords: ['default', 'uniswap'],
  name: 'Uniswap Labs Default',
  tags: {},
  timestamp: '2023-12-13T18:25:25.830Z',
  tokens: tokens.concat(nativeTokens),
}
