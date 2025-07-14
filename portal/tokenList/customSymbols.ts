import { hemi, hemiSepolia } from 'hemi-viem'
import { Extensions } from 'types/token'
import { Chain } from 'viem'

export const customSymbolsList: Partial<
  Record<Chain['id'], Record<string, Pick<Extensions, 'customSymbol'>>>
> = {
  // Prefer ordering by symbol in comments, instead of by address, which makes it harder
  // to search for a specific token.
  /* eslint-disable sort-keys */
  [hemi.id]: {
    // brBTC
    '0x93919784C523f39CACaa98Ee0a9d96c3F32b593e': {
      customSymbol: 'brBTC',
    },
    // egETH
    '0x027a9d301FB747cd972CFB29A63f3BDA551DFc5c': {
      customSymbol: 'egETH',
    },
    // MBTC - Liquid Staked BTC
    '0x0Af3EC6F9592C193196bEf220BC0Ce4D9311527D': {
      customSymbol: 'mBTC',
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      customSymbol: 'USDT',
    },
  },
  [hemiSepolia.id]: {
    // DAI
    '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e': {
      customSymbol: 'DAI',
    },
    // hemiBTC
    '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7': {
      customSymbol: 'tBTC',
    },
  },
  /* eslint-disable sort-keys */
}
