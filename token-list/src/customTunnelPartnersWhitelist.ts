import { hemi } from 'hemi-viem'
import { type Chain } from 'viem'
import { mainnet } from 'viem/chains'

import { type Extensions } from './types'

export const customTunnelPartnersWhitelist: Partial<
  Record<Chain['id'], Record<string, Pick<Extensions, 'tunnelPartner'>>>
> = {
  [mainnet.id]: {
    // USDC
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      tunnelPartner: 'stargate',
    },
    // USDT
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      tunnelPartner: 'stargate',
    },
  },
  [hemi.id]: {
    // USDC
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      tunnelPartner: 'stargate',
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      tunnelPartner: 'stargate',
    },
  },
}
