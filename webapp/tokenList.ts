/* eslint-disable sort-keys */
// example list for Token list - will probably need to be loaded from somewhere

import { hemi } from 'app/networks'
import { Token } from 'types/token'
import { sepolia } from 'wagmi/chains'

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
          tokenAddress: '0xec46e0efb2ea8152da0327a5eb3ff9a43956f13e',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
  },
  {
    address: '0xec46e0efb2ea8152da0327a5eb3ff9a43956f13e',
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
    name: 'Tunneled DAI',
    symbol: 'tDAI',
  },
]

const nativeTokens: Token[] = [
  {
    address: 'ETH',
    chainId: 1,
    decimals: 18,
    logoURI: ethLogoUri,
    name: 'Ether',
    symbol: 'ETH',
  },
  {
    address: 'sepETH',
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    logoURI: ethLogoUri,
    name: 'sepolia Ether',
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: 'HEMI',
    chainId: hemi.id,
    decimals: hemi.nativeCurrency.decimals,
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
