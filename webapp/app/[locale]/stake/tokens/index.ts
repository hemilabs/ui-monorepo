import { StakeToken } from 'types/stake'

import enzoBtc from './images/enzoBtc.png'
import iBtc from './images/iBtc.png'
import mBtc from './images/mBtc.png'
import pumpBtc from './images/pumpBtc.png'
import stBtc from './images/stBtc.png'
import uBtc from './images/uBtc.png'

// Not sure if it's the best place to put this list of tokens
// TODO: add missing tokens
// Related to the issue #752 - https://github.com/hemilabs/ui-monorepo/issues/752

export const stakeTokens: StakeToken[] = [
  {
    address: '0x9BFA177621119e64CecbEabE184ab9993E2ef727',
    chainId: 43111,
    decimals: 18,
    extensions: {
      birthBlock: 849309,
    },
    logo: mBtc,
    name: 'Merlin BTC',
    protocol: 'merlinChain',
    symbol: 'M-BTC',
  },
  {
    address: '0x8154Aaf094c2f03Ad550B6890E1d4264B5DdaD9A',
    chainId: 43111,
    decimals: 18,
    extensions: {
      birthBlock: 629450,
    },
    logo: iBtc,
    name: 'iBTC',
    protocol: 'exSat',
    symbol: 'iBTC',
  },
  {
    address: '0x6A9A65B84843F5fD4aC9a0471C4fc11AFfFBce4a',
    chainId: 43111,
    decimals: 8,
    extensions: {
      birthBlock: 734357,
    },
    logo: enzoBtc,
    name: 'Lorenzo Wrapped Bitcoin',
    protocol: 'lorenzo',
    symbol: 'enzoBTC',
  },
  {
    address: '0xf6718b2701D4a6498eF77D7c152b2137Ab28b8A3',
    chainId: 43111,
    decimals: 18,
    extensions: {
      birthBlock: 619947,
    },
    logo: stBtc,
    name: 'Lorenzo stBTC',
    protocol: 'lorenzo',
    symbol: 'stBTC',
  },
  {
    address: '0xF469fBD2abcd6B9de8E169d128226C0Fc90a012e',
    chainId: 43111,
    decimals: 8,
    extensions: {
      birthBlock: 595343,
    },
    logo: pumpBtc,
    name: 'pumpBTC',
    protocol: 'pumpBtc',
    symbol: 'pumpBTC',
  },
  {
    address: '0x78E26E8b953C7c78A58d69d8B9A91745C2BbB258',
    chainId: 43111,
    decimals: 18,
    extensions: {
      birthBlock: 792952,
    },
    logo: uBtc,
    name: 'uBTC',
    protocol: 'uniRouter',
    symbol: 'uBTC',
  },
]
