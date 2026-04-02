'use client'

import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'
import { zeroAddress } from 'viem'

import { type EarnPosition } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const useEarnPositions = function (): EarnPosition[] {
  const { id: chainId } = useHemi()
  const tokens = useHemiEarnTokens()

  return useMemo(
    function () {
      const vaultAddresses = getEarnVaultAddresses(chainId)
      // TODO: remove mock positions and fetch real user positions once vaults are deployed
      return tokens.slice(0, 2).map((token, index) => ({
        apy: { base: 1, incentivized: 3.32, total: 4.32 },
        token,
        vaultAddress: vaultAddresses[index] ?? zeroAddress,
        yieldEarned: '$12.34',
        yourDeposit: BigInt(100000),
      }))
    },
    [tokens, chainId],
  )
}
