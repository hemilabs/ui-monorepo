import { hemi, hemiSepolia } from 'hemi-viem'
import { StakeExtensions } from 'types/stake'
import { Token } from 'types/token'
import { mainnet, sepolia } from 'viem/chains'

// TODO: Some tokens are not deployed, so their rewards can't be configured
// https://github.com/hemilabs/ui-monorepo/issues/752#issuecomment-2616916547
export const stakeWhiteList: Partial<
  Record<Token['chainId'], Record<string, StakeExtensions>>
> = {
  [hemi.id]: {
    // Prefer ordering by symbol in comments, instead of by address, which makes it harder
    // to search for a specific token.
    /* eslint-disable sort-keys */
    // brBTC
    '0x93919784C523f39CACaa98Ee0a9d96c3F32b593e': {
      protocol: 'bedRock',
      priceSymbol: 'btc',
      rewards: ['hemi', 'bedrock'],
      stakeSymbol: 'brBTC',
      website: 'https://www.bedrock.technology',
    },
    // DAI
    '0x6c851F501a3F24E29A8E39a29591cddf09369080': {
      protocol: 'makerDao',
      rewards: ['hemi'],
      website: 'https://makerdao.com/en',
    },
    // egETH
    '0x027a9d301FB747cd972CFB29A63f3BDA551DFc5c': {
      protocol: 'egEth',
      priceSymbol: 'eth',
      rewards: ['hemi2x', 'eigenpie'],
      stakeSymbol: 'egETH',
      website: 'https://www.eigenlayer.magpiexyz.io/restake',
    },
    // enzoBTC
    '0x6A9A65B84843F5fD4aC9a0471C4fc11AFfFBce4a': {
      protocol: 'lorenzo',
      priceSymbol: 'btc',
      rewards: ['hemi', 'lorenzo'],
      website: 'https://lorenzo-protocol.xyz',
    },
    // ETH
    [mainnet.nativeCurrency.symbol]: {
      protocol: 'ethereum',
      rewards: ['hemi'],
      website: 'https://ethereum.org/en',
    },
    // hemiBTC
    '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28': {
      protocol: 'hemi',
      priceSymbol: 'btc',
      rewards: ['hemi2x'],
      website: 'https://www.hemi.xyz',
    },
    // iBTC
    '0x8154Aaf094c2f03Ad550B6890E1d4264B5DdaD9A': {
      protocol: 'exSat',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: 'https://exsat.network',
    },
    // MBTC - Liquid Staked BTC
    '0x0Af3EC6F9592C193196bEf220BC0Ce4D9311527D': {
      protocol: 'babypie',
      priceSymbol: 'btc',
      rewards: ['hemi2x', 'babypie'],
      stakeSymbol: 'mBTC',
      website: 'https://www.babylon.magpiexyz.io/stake',
    },
    // M-BTC
    '0x9BFA177621119e64CecbEabE184ab9993E2ef727': {
      protocol: 'merlinChain',
      rewards: ['hemi'],
      website: 'https://merlinchain.io',
    },
    // oBTC
    '0xe3C0FF176eF92FC225096C6d1788cCB818808b35': {
      protocol: 'obeliskNodeDao',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: 'https://obelisk.nodedao.com/',
    },
    // pumpBTC
    '0xF469fBD2abcd6B9de8E169d128226C0Fc90a012e': {
      protocol: 'pumpBtc',
      rewards: ['hemi', 'pumpbtc'],
      website: 'https://mainnet.pumpbtc.xyz',
    },
    // rsETH
    '0xc3eACf0612346366Db554C991D7858716db09f58': {
      protocol: 'kelp',
      priceSymbol: 'eth',
      rewards: ['hemi'],
      website: 'https://kerneldao.com/kelp',
    },
    // stBTC
    '0xf6718b2701D4a6498eF77D7c152b2137Ab28b8A3': {
      protocol: 'lorenzo',
      priceSymbol: 'btc',
      rewards: ['hemi', 'lorenzo'],
      website: 'https://lorenzo-protocol.xyz',
    },
    // suBTC
    '0xe85411C030fB32A9D8b14Bbbc6CB19417391F711': {
      protocol: 'sumer',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: 'https://sumer.money',
    },
    // tBTC v2
    '0x12B6e6FC45f81cDa81d2656B974E8190e4ab8D93': {
      protocol: 'threshold',
      priceSymbol: 'btc',
      rewards: ['hemi'],
      website: 'https://threshold.network',
    },
    // uBTC
    '0x78E26E8b953C7c78A58d69d8B9A91745C2BbB258': {
      protocol: 'uniRouter',
      priceSymbol: 'btc',
      rewards: ['hemi', 'unirouter', 'bsquared'],
      website: 'https://www.unirouter.io/#',
    },
    // uniBTC
    '0xF9775085d726E782E83585033B58606f7731AB18': {
      protocol: 'uniBtc',
      priceSymbol: 'btc',
      rewards: ['hemi', 'bedrock'],
      website: 'https://app.bedrock.technology/unibtc?tab=swap_deposit',
    },
    // USDC
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      // token symbol in hemi mainnet is usdc.e
      priceSymbol: 'usdc',
      protocol: 'circle',
      rewards: ['hemi2x'],
      website: 'https://www.circle.com',
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      protocol: 'tether',
      rewards: ['hemi2x'],
      website: 'https://tether.to/en',
    },
    // VUSD
    '0x7A06C4AeF988e7925575C50261297a946aD204A8': {
      protocol: 'hemi',
      priceSymbol: 'usdt',
      rewards: ['hemi'],
      website: 'https://www.hemi.xyz',
    },
    // WBTC
    '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3': {
      protocol: 'wbtc',
      rewards: ['hemi'],
      website: 'https://www.wbtc.network',
    },
    // WETH
    '0x4200000000000000000000000000000000000006': {
      protocol: 'hemi',
      rewards: ['hemi'],
      website: 'https://www.hemi.xyz',
    },
    // ynCoBTCk
    '0x8970a6A9Eae065aA81a94E86ebCAF4F3d4dd6DA1': {
      priceSymbol: 'btc',
      protocol: 'yieldNest',
      rewards: ['hemi', 'kernel', 'yieldnest'],
      website: 'https://app.yieldnest.finance/restake/ynCoBTCk',
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
      website: 'https://www.hemi.xyz',
    },
    // Sepolia
    [sepolia.nativeCurrency.symbol]: {
      protocol: 'ethereum',
      rewards: [],
      website: 'https://ethereum.org/en',
    },
    // USDC
    '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443': {
      // token symbol in Hemi Sepolia is usdc.e
      priceSymbol: 'usdc',
      protocol: 'hemi',
      rewards: [],
      website: 'https://www.hemi.xyz',
    },
    // USDT
    '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298': {
      // token symbol in Hemi Sepolia is usdt.e
      priceSymbol: 'usdt',
      protocol: 'hemi',
      rewards: [],
      website: 'https://www.hemi.xyz',
    },
    // WETH
    '0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A': {
      protocol: 'hemi',
      rewards: [],
      website: 'https://www.hemi.xyz',
    },
    /* eslint-enable sort-keys */
  },
}
