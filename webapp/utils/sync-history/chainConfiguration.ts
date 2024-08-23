import { bitcoin, hemi } from 'app/networks'
import { sepolia } from 'viem/chains'

export const chainConfiguration = {
  [bitcoin.id]: {
    // bitcoin API doesn't allow to set a block window size
  },
  [hemi.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
  },
  [sepolia.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
} as const
