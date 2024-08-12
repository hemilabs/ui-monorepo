import { bitcoin, hemi } from 'app/networks'
import { sepolia } from 'viem/chains'

export const chainConfiguration = {
  [bitcoin.id]: {
    // TODO define proper block windows size https://github.com/hemilabs/ui-monorepo/issues/345
    blockWindowSize: 3500,
  },
  [hemi.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
  },
  [sepolia.id]: {
    blockWindowSize: 3500, // Approximately 1/2 day
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
} as const
