import * as Sentry from '@sentry/nextjs'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useEffect } from 'react'

// Once mainnet goes live, default should be changed to mainnet
// See https://github.com/hemilabs/ui-monorepo/issues/479
export const networkTypes = ['mainnet', 'testnet'] as const
export type NetworkType = (typeof networkTypes)[number]

export const defaultNetworkType = 'mainnet'

export const useNetworkType = function () {
  const state = useQueryState(
    'networkType',
    parseAsStringLiteral(networkTypes).withDefault(defaultNetworkType),
  )

  const [networkType] = state

  useEffect(
    function recordNetworkTypeOnSentry() {
      Sentry.setTag('network', networkType)
    },
    [networkType],
  )

  return state
}
