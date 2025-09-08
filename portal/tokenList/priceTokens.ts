import hemilabsTokenList from '@hemilabs/token-list'
import { hemi, hemiSepolia } from 'hemi-viem'
import { Extensions } from 'types/token'
import { Address, Chain } from 'viem'

type PriceMap = Record<Address, Pick<Extensions, 'priceSymbol'>>

// BTC tokens on Hemi
const btcAddresses = [
  // BGBTC
  '0x5B6d6D09F425da2a816D1cDBabd049449Ae8d8e6',
  // brBTC
  '0x93919784C523f39CACaa98Ee0a9d96c3F32b593e',
  // enzoBTC
  '0x6A9A65B84843F5fD4aC9a0471C4fc11AFfFBce4a',
  // hemiBTC
  '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
  // iBTC
  '0x8154Aaf094c2f03Ad550B6890E1d4264B5DdaD9A',
  // MBTC - Liquid Staked BTC
  '0x0Af3EC6F9592C193196bEf220BC0Ce4D9311527D',
  // oBTC
  '0xe3C0FF176eF92FC225096C6d1788cCB818808b35',
  // stBTC
  '0xf6718b2701D4a6498eF77D7c152b2137Ab28b8A3',
  // suBTC
  '0xe85411C030fB32A9D8b14Bbbc6CB19417391F711',
  // tBTC v2
  '0x12B6e6FC45f81cDa81d2656B974E8190e4ab8D93',
  // uBTC
  '0x78E26E8b953C7c78A58d69d8B9A91745C2BbB258',
  // uniBTC
  '0xF9775085d726E782E83585033B58606f7731AB18',
  // ynCoBTCk
  '0x8970a6A9Eae065aA81a94E86ebCAF4F3d4dd6DA1',
]

// ETH tokens on Hemi
const ethAddresses = [
  // egETH
  '0x027a9d301FB747cd972CFB29A63f3BDA551DFc5c',
  // rsETH
  '0xc3eACf0612346366Db554C991D7858716db09f58',
]

// USDC tokens on Hemi
const usdcAddresses = [
  // satUSD
  '0xb4818BB69478730EF4e33Cc068dD94278e2766cB',
  // USDC (token symbol in Hemi is usdc.e)
  '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA',
]

const getL1TokenMaps = (priceMaps: PriceMap, hemiChain: Chain) =>
  Object.fromEntries(
    Object.entries(priceMaps)
      .map(function ([address, { priceSymbol }]) {
        const l1Address = hemilabsTokenList.tokens.find(
          t => t.chainId === hemiChain.id && t.address === address,
        )?.extensions?.bridgeInfo?.[hemiChain.sourceId!]?.tokenAddress
        if (!l1Address) {
          return null
        }
        return [l1Address, { priceSymbol }]
      })
      // Remove those that don't have a L1 address, like some stake tokens
      .filter(
        (entry): entry is [string, { priceSymbol: string }] => entry !== null,
      ),
  )

function getMainnetPriceList() {
  const tokenMaps = {
    // Prefer ordering by symbol in comments, instead of by address, which makes it harder
    // to search for a specific token.
    /* eslint-disable sort-keys */
    // bwAJNA
    '0x63D367531B460Da78a9EBBAF6c1FBFC397E5d40A': {
      priceSymbol: 'ajna',
    },
    // VUSD
    '0x7A06C4AeF988e7925575C50261297a946aD204A8': {
      priceSymbol: 'usdt',
    },
    ...Object.fromEntries([
      ...btcAddresses.map(address => [address, { priceSymbol: 'btc' }]),
      ...ethAddresses.map(address => [address, { priceSymbol: 'eth' }]),
      ...usdcAddresses.map(address => [address, { priceSymbol: 'usdc' }]),
    ]),
    /* eslint-disable sort-keys */
  } satisfies PriceMap

  return {
    [hemi.id]: tokenMaps,
    [hemi.sourceId]: getL1TokenMaps(tokenMaps, hemi),
  }
}

function getSepoliaPriceList() {
  // Prefer ordering by symbol in comments, instead of by address, which makes it harder
  // to search for a specific token.
  /* eslint-disable sort-keys */
  const tokenMaps = {
    // USDC
    '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443': {
      // token symbol in Hemi Sepolia is usdc.e
      priceSymbol: 'usdc',
    },
    // USDT
    '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298': {
      // token symbol in Hemi Sepolia is usdt.e
      priceSymbol: 'usdt',
    },
  } satisfies PriceMap
  /* eslint-disable sort-keys */

  return {
    [hemiSepolia.id]: tokenMaps,
    [hemiSepolia.sourceId]: getL1TokenMaps(tokenMaps, hemiSepolia),
  }
}

export const priceWhiteList: Record<Chain['id'], PriceMap> = {
  ...getMainnetPriceList(),
  ...getSepoliaPriceList(),
}
