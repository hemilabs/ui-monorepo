import { hemi, hemiSepolia } from 'hemi-viem'
import { StakeExtensions } from 'types/stake'
import { Token } from 'types/token'
import { Address } from 'viem'

const websitesMap: Partial<Record<StakeExtensions['protocol'], string>> = {
  bedRock: 'https://www.bedrock.technology',
  bitFi: 'https://www.bitfi.one',
  circle: 'https://www.circle.com',
  exSat: 'https://exsat.network',
  hemi: 'https://www.hemi.xyz',
  lorenzo: 'https://lorenzo-protocol.xyz',
  makerDao: 'https://makerdao.com/en',
  merlinChain: 'https://merlinchain.io',
  obeliskNodeDao: 'https://obelisk.nodedao.com/',
  pumpBtc: 'https://mainnet.pumpbtc.xyz',
  solv: 'https://solv.finance',
  stakeStone: 'https://stakestone.io/#/home',
  tether: 'https://tether.to/en',
  threshold: 'https://threshold.network',
  uniRouter: 'https://www.unirouter.io/#',
  wbtc: 'https://www.wbtc.network',
}

// TODO: Some tokens are not deployed, so their rewards can't be configured
// https://github.com/hemilabs/ui-monorepo/issues/752#issuecomment-2616916547
export const stakeWhiteList: Partial<
  Record<Token['chainId'], Record<Address, StakeExtensions>>
> = {
  [hemi.id]: {
    // Prefer ordering by symbol in comments, instead of by address, which makes it harder
    // to search for a specific token.
    /* eslint-disable sort-keys */
    // DAI
    '0x6c851F501a3F24E29A8E39a29591cddf09369080': {
      protocol: 'makerDao',
      rewards: ['hemi'],
      website: websitesMap.makerDao,
    },
    // enzoBTC
    '0x6A9A65B84843F5fD4aC9a0471C4fc11AFfFBce4a': {
      protocol: 'lorenzo',
      priceSymbol: 'btc',
      rewards: ['hemi', 'lorenzo'],
      website: websitesMap.lorenzo,
    },
    // hemiBTC
    '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28': {
      protocol: 'hemi',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: websitesMap.hemi,
    },
    // iBTC
    '0x8154Aaf094c2f03Ad550B6890E1d4264B5DdaD9A': {
      protocol: 'exSat',
      priceSymbol: 'btc',
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
      protocol: 'obeliskNodeDao',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: websitesMap.obeliskNodeDao,
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
      priceSymbol: 'btc',
      rewards: ['hemi', 'lorenzo'],
      website: websitesMap.lorenzo,
    },
    // tBTC v2
    '0x12B6e6FC45f81cDa81d2656B974E8190e4ab8D93': {
      protocol: 'threshold',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: websitesMap.threshold,
    },
    // uBTC
    '0x78E26E8b953C7c78A58d69d8B9A91745C2BbB258': {
      protocol: 'uniRouter',
      priceSymbol: 'btc',
      rewards: ['hemi', 'unirouter', 'bsquared'],
      website: websitesMap.uniRouter,
    },
    // USDC
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      // token symbol in hemi mainnet is usdc.e
      priceSymbol: 'usdc.e',
      protocol: 'circle',
      rewards: ['hemi'],
      website: websitesMap.circle,
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      protocol: 'tether',
      rewards: ['hemi'],
      website: websitesMap.tether,
    },
    // VUSD
    '0x7A06C4AeF988e7925575C50261297a946aD204A8': {
      protocol: 'hemi',
      priceSymbol: 'usdt',
      rewards: ['hemi'],
      website: websitesMap.hemi,
    },
    // WBTC
    '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3': {
      protocol: 'wbtc',
      rewards: ['hemi'],
      website: websitesMap.wbtc,
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
      // token symbol in Hemi Sepolia is usdc.e
      priceSymbol: 'usdc',
      protocol: 'hemi',
      rewards: [],
      website: websitesMap.hemi,
    },
    // USDT
    '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298': {
      // token symbol in Hemi Sepolia is usdt.e
      priceSymbol: 'usdt',
      protocol: 'hemi',
      rewards: [],
      website: websitesMap.hemi,
    },
    /* eslint-enable sort-keys */
  },
}
