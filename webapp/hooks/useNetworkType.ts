import { useQueryState, parseAsStringLiteral } from 'nuqs'

// Add mainnet and, once mainnet goes live,
// default should be changed to mainnet
// See https://github.com/hemilabs/ui-monorepo/issues/479
const networkTypes = ['testnet'] as const

export const useNetworkType = () =>
  useQueryState(
    'networkType',
    parseAsStringLiteral(networkTypes).withDefault(networkTypes[0]),
  )
