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
    // cbBTC
    '0x9778bC12904DB935Ca8be4fae26636BF7D6Da456': {
      name: 'Coinbase Wrapped BTC (Stargate)',
    },
    // USDC.e
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      name: 'USDC (Stargate)',
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      name: 'USDT (Stargate)',
    },
  },
  [hemi.sourceId]: {
    // USDC
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      name: 'USDC',
    },
    // USDT
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      name: 'USDT',
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
