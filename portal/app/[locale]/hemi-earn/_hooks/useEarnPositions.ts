'use client'

import { useMemo } from 'react'

import { type EarnPosition } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const useEarnPositions = function (): EarnPosition[] {
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useMemo(
    () =>
      // TODO: remove mock positions and fetch real user positions once vaults are deployed
      vaultTokens.slice(0, 2).map(({ token, vaultAddress }) => ({
        apy: { base: 1, incentivized: 3.32, total: 4.32 },
        token,
        vaultAddress,
        yieldEarned: '$12.34',
        yourDeposit: BigInt(100000),
      })),
    [vaultTokens],
  )
}
