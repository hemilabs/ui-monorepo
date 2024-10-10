import { useQueryState, parseAsStringLiteral } from 'nuqs'

// Once mainnet goes live, default should be changed to mainnet
// See https://github.com/hemilabs/ui-monorepo/issues/479
export const networkTypes = ['mainnet', 'testnet'] as const
export type NetworkType = (typeof networkTypes)[number]

export const useNetworkType = () =>
  useQueryState(
    'networkType',
    parseAsStringLiteral(networkTypes).withDefault(networkTypes[1]),
  )
