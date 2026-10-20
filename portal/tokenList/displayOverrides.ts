import { hemi, hemiSepolia } from 'hemi-viem'
import { type Token } from 'types/token'

export const displayOverrides: Partial<
  Record<
    Token['chainId'],
    Record<string, Partial<Pick<Token, 'name' | 'symbol'>>>
  >
> = {
  [hemi.id]: {
    // VUSD
    '0x7A06C4AeF988e7925575C50261297a946aD204A8': {
      name: 'Vesper USD',
    },
    // USDC.e
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      name: 'USDC',
    },
  },
  [hemiSepolia.id]: {
    // hBTC
    '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7': {
      name: 'Testnet Bitcoin',
      symbol: 'tBTC',
    },
    // hDAI
    '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e': {
      name: 'Dai Stablecoin',
      symbol: 'DAI',
    },
  },
}
