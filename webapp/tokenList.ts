/* eslint-disable sort-keys */
// example list for Token list - will probably need to be loaded from somewhere

import { bvm } from 'app/networks'
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
        [bvm.id]: {
          tokenAddress: '0x97942656B0EfC2555155cEA70Cb3C716C33EcF70',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
  },
  {
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    chainId: sepolia.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [bvm.id]: {
          tokenAddress: '0x221f3Ea46017307daCaf669F38529223B08f3178',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    name: 'USDT',
    symbol: 'USDT',
  },
  {
    address: '0x97942656B0EfC2555155cEA70Cb3C716C33EcF70',
    chainId: bvm.id,
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
  {
    address: '0x221f3Ea46017307daCaf669F38529223B08f3178',
    chainId: bvm.id,
    decimals: 6,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
        },
      },
    },
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    name: 'Tunneled USDT',
    symbol: 'tUSDT',
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
    address: 'BVM',
    chainId: bvm.id,
    decimals: bvm.nativeCurrency.decimals,
    // using random logo for now
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    name: bvm.nativeCurrency.name,
    symbol: bvm.nativeCurrency.symbol,
  },
]

export const tokenList = {
  keywords: ['default', 'uniswap'],
  name: 'Uniswap Labs Default',
  tags: {},
  timestamp: '2023-12-13T18:25:25.830Z',
  tokens: tokens.concat(nativeTokens),
}
