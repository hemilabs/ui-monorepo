/* eslint-disable sort-keys */
// example list for Token list - will probably need to be loaded from somewhere

import { hemi } from 'app/networks'
import { Token } from 'types/token'
import { sepolia } from 'wagmi/chains'

// this is just for modeling the UI
const tokens: Token[] = [
  {
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    chainId: sepolia.id,
    decimals: 18,
    extensions: {
      bridgeInfo: {
        [hemi.id]: {
          tokenAddress: '0x7c0d8ddd8e736fb22f2acd3c12502c8c49737237',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
  },
  {
    address: '7c0d8ddd8e736fb22f2acd3c12502c8c49737237',
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
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/5dacd70ae31627be3ff510fe1bb8bc3bf1453cca/blockchains/ethereum/info/logo.png',
    name: 'Ether',
    symbol: 'ETH',
  },
  {
    address: 'sepETH',
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/5dacd70ae31627be3ff510fe1bb8bc3bf1453cca/blockchains/ethereum/info/logo.png',
    name: 'sepolia Ether',
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: 'HEMI',
    chainId: hemi.id,
    decimals: hemi.nativeCurrency.decimals,
    // using random logo for now
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
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
