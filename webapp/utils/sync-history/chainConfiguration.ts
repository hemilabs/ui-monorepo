import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'

// Approximately 1/2 day
const opBasedEvmBlockWindowSize = 3500

export const chainConfiguration = {
  [hemiMainnet.id]: {
    blockWindowSize: opBasedEvmBlockWindowSize,
  },
  [hemiTestnet.id]: {
    blockWindowSize: opBasedEvmBlockWindowSize,
  },
  [mainnet.id]: {
    blockWindowSize: 800, // Eth RPC only allows up to 800 blocks per request
    minBlockToSync: 20_711_548, // Eth block of hemi mainnet birth
  },
  [sepolia.id]: {
    blockWindowSize: opBasedEvmBlockWindowSize,
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
} as const
