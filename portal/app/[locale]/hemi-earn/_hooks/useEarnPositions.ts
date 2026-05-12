'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount } from 'wagmi'

import { type EarnPosition } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const earnPositionsKeyPrefix = ['hemi-earn', 'positions']

// TODO(phase-2): mocked intentionally. Real implementation needs to read each
// user's position by querying their sVetBTC OFT balance on Hemi and converting
// to assets via the StakingVault on Ethereum, plus yield earned over time
// (likely indexed via subgraph by receiver from `RequestClaimed` events). Out
// of scope for the Router refactor.
export const useEarnPositions = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery<EarnPosition[]>({
    enabled: !!address && vaultTokens.length > 0,
    queryFn: () => [],
    queryKey: [
      ...earnPositionsKeyPrefix,
      networkType,
      address,
      ...vaultTokens.map(vt => vt.vaultAddress),
    ],
  })
}
