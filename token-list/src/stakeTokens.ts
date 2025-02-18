import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

import { type Extensions, type Token } from './types'

const websitesMap: Partial<Record<Extensions['protocol'], string>> = {
  bedRock: 'https://www.bedrock.technology',
  bitFi: 'https://www.bitfi.one',
  exSat: 'https://exsat.network',
  hemi: 'https://www.hemi.xyz',
  lorenzo: 'https://lorenzo-protocol.xyz',
  merlinChain: 'https://merlinchain.io',
  nodeDao: 'https://www.nodedao.com',
  pumpBtc: 'https://mainnet.pumpbtc.xyz',
  solv: 'https://solv.finance',
  stakeStone: 'https://stakestone.io/#/home',
  uniRouter: 'https://www.unirouter.io/#',
}

// TODO: Some tokens are not deployed, so their rewards can't be configured
// https://github.com/hemilabs/ui-monorepo/issues/752#issuecomment-2616916547
export const stakeWhiteList: Partial<
  Record<Token['chainId'], Record<Address, Extensions>>
> = {
  [hemi.id]: {
    // Prefer ordering by symbol in comments, instead of by address, which makes it harder
    // to search for a specific token.
    /* eslint-disable sort-keys */
    // enzoBTC
    '0x6A9A65B84843F5fD4aC9a0471C4fc11AFfFBce4a': {
      protocol: 'lorenzo',
      rewards: ['hemi', 'lorenzo'],
      website: websitesMap.lorenzo,
    },
    // iBTC
    '0x8154Aaf094c2f03Ad550B6890E1d4264B5DdaD9A': {
      protocol: 'exSat',
      rewards: ['hemi'],
      website: websitesMap.exSat,
    },
    // M-BTC
    '0x9BFA177621119e64CecbEabE184ab9993E2ef727': {
      protocol: 'merlinChain',
      rewards: ['hemi'],
      website: websitesMap.merlinChain,
    },
    // oBTC
    '0xe3C0FF176eF92FC225096C6d1788cCB818808b35': {
      protocol: 'nodeDao',
      rewards: ['hemi'],
      website: websitesMap.nodeDao,
    },
    // pumpBTC
    '0xF469fBD2abcd6B9de8E169d128226C0Fc90a012e': {
      protocol: 'pumpBtc',
      rewards: ['hemi', 'pumpbtc'],
      website: websitesMap.pumpBtc,
    },
    // stBTC
    '0xf6718b2701D4a6498eF77D7c152b2137Ab28b8A3': {
      protocol: 'lorenzo',
      rewards: ['hemi', 'lorenzo'],
      website: websitesMap.lorenzo,
    },
    // uBTC
    '0x78E26E8b953C7c78A58d69d8B9A91745C2BbB258': {
      protocol: 'uniRouter',
      rewards: ['hemi', 'unirouter', 'bsquared'],
      website: websitesMap.uniRouter,
    },
    /* eslint-enable sort-keys */
  },
  [hemiSepolia.id]: {
    // Prefer ordering by symbol in comments, instead of by address, which makes it harder
    // to search for a specific token.
    /* eslint-disable sort-keys */
    // Dai
    '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e': {
      protocol: 'hemi',
      rewards: [],
      website: websitesMap.hemi,
    },
    // USDC
    '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443': {
      protocol: 'hemi',
      rewards: [],
      website: websitesMap.hemi,
    },
    // USDT
    '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298': {
      protocol: 'hemi',
      rewards: [],
      website: websitesMap.hemi,
    },
    /* eslint-enable sort-keys */
  },
}
