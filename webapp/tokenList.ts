/* eslint-disable sort-keys */
// example list for Token list - will probably need to be loaded from somewhere

import { hemi } from 'app/networks'
import { Token } from 'types/token'
import { Address } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const ethLogoUri = `data:image/svg+xml,%3Csvg fill='none' height='24' width='25' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23627EEA' d='M12.5 24c6.627 0 12-5.373 12-12s-5.373-12-12-12S.5 5.373.5 12s5.373 12 12 12Z' /%3E%3Cg fill='%23fff'%3E%3Cpath d='M12.873 3v6.652l5.623 2.513L12.873 3Z' fill-opacity='0.602' /%3E%3Cpath d='M12.873 3 7.25 12.165l5.623-2.512V3Z' /%3E%3Cpath d='M12.873 16.476v4.52l5.627-7.784-5.627 3.264Z' fill-opacity='0.602' /%3E%3Cpath d='M12.873 20.996v-4.52L7.25 13.211l5.623 7.784Z' /%3E%3Cpath d='m12.873 15.43 5.623-3.265-5.623-2.51v5.775Z' fill-opacity='0.2' /%3E%3Cpath d='m7.25 12.165 5.623 3.265V9.654L7.25 12.165Z' fill-opacity='0.602' /%3E%3C/g%3E%3C/svg%3E`

// this is just for modeling the UI
const tokens: Token[] = [
  {
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    chainId: sepolia.id,
    decimals: 18,
    extensions: {
      bridgeInfo: {
        [hemi.id]: {
          tokenAddress: '0x141A1972B03C99A3b46fc62cAC8b79778D8b7B70',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
  },
  {
    address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    chainId: sepolia.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [hemi.id]: {
          tokenAddress: '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    name: 'USD Coin',
    symbol: 'USDC',
  },
  {
    address: '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0',
    chainId: sepolia.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [hemi.id]: {
          tokenAddress: '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    name: 'Tether',
    symbol: 'USDT',
  },
  {
    address: '0x141A1972B03C99A3b46fc62cAC8b79778D8b7B70',
    chainId: hemi.id,
    decimals: 18,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    name: 'Testnet Hemi DAI',
    symbol: 'DAI',
  },
  {
    address: '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443',
    chainId: hemi.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    name: 'USD Coin',
    symbol: 'USDC.e',
  },
  {
    address: '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298',
    chainId: hemi.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    name: 'Tether',
    symbol: 'USDT.e',
  },
]

const nativeTokens: Token[] = [
  {
    address: mainnet.nativeCurrency.symbol,
    chainId: mainnet.id,
    decimals: 18,
    logoURI: ethLogoUri,
    name: mainnet.nativeCurrency.name,
    symbol: mainnet.nativeCurrency.symbol,
  },
  {
    address: sepolia.nativeCurrency.symbol,
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    logoURI: ethLogoUri,
    name: sepolia.nativeCurrency.name,
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: hemi.nativeCurrency.symbol,
    chainId: hemi.id,
    decimals: hemi.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [mainnet.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
        [sepolia.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    name: hemi.nativeCurrency.name,
    symbol: hemi.nativeCurrency.symbol,
  },
]

export const tokenList = {
  keywords: ['default', 'uniswap'],
  name: 'Uniswap Labs Default',
  tags: {},
  timestamp: '2023-12-13T18:25:25.830Z',
  tokens: tokens.concat(nativeTokens),
}
