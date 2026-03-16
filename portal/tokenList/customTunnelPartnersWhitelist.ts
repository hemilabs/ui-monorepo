import { hemi } from 'hemi-viem'
import { Extensions } from 'types/token'
import { Chain } from 'viem'
import { mainnet } from 'viem/chains'

export const customTunnelPartnersWhitelist: Partial<
  Record<
    Chain['id'],
    Record<string, Pick<Extensions, 'tunnelSymbol' | 'tunnelPartners'>>
  >
> = {
  [mainnet.id]: {
    // USDC
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      tunnelPartners: ['meson', 'stargate', 'freetech', 'orbiter'],
      tunnelSymbol: 'USDC',
    },
    // cbBTC
    '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': {
      tunnelPartners: ['meson', 'stargate', 'freetech', 'orbiter'],
      tunnelSymbol: 'cbBTC',
    },
    // USDT
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      tunnelPartners: ['meson', 'stargate', 'freetech'],
    },
  },
  [hemi.id]: {
    //cbBTC
    '0x1596bE338B999E2376675C908168A7548C8B0525': {
      tunnelPartners: ['meson', 'stargate', 'freetech', 'orbiter'],
      tunnelSymbol: 'cbBTC',
    },
    // USDC
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA': {
      tunnelPartners: ['meson', 'stargate', 'freetech', 'orbiter'],
      tunnelSymbol: 'USDC',
    },
    // USDT
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e': {
      tunnelPartners: ['meson', 'stargate', 'freetech'],
      tunnelSymbol: 'USDT',
    },
  },
}
