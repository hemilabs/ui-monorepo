import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { sepolia } from 'viem/chains'

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
