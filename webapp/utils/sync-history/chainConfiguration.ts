import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
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
  [sepolia.id]: {
    blockWindowSize: opBasedEvmBlockWindowSize,
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
} as const
