'use client'

import { useQuery } from '@tanstack/react-query'
import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useMemo } from 'react'
import { type EvmToken } from 'types/token'
import { type Address, zeroAddress } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

import { type EarnPool } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const useEarnPools = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { data: tokens = [] } = useHemiEarnTokens()

  const vaultTokens = useMemo<{ token: EvmToken; vaultAddress: Address }[]>(
    function () {
      const vaultAddresses = getEarnVaultAddresses(chainId)
      return tokens.map((token, index) => ({
        token,
        vaultAddress: vaultAddresses[index] ?? zeroAddress,
      }))
    },
    [tokens, chainId],
  )

  return useQuery<EarnPool[]>({
    enabled: vaultTokens.length > 0,
    async queryFn() {
      const deposits = await Promise.all(
        vaultTokens.map(({ vaultAddress }) =>
          vaultAddress !== zeroAddress
            ? totalAssets(hemiClient, { address: vaultAddress })
            : Promise.resolve(BigInt(0)),
        ),
      )

      // TODO: apy requires off-chain data once available
      // TODO: exposure tokens are not finalized — using pool token + counterpart as placeholder
      return vaultTokens.map(({ token, vaultAddress }, index) => ({
        apy: { base: 0, incentivized: 0, total: 0 },
        exposureTokens: (vaultTokens[(index + 1) % vaultTokens.length]?.token
          .address !== token.address
          ? [
              { address: token.address as Address, chainId: token.chainId },
              {
                address: vaultTokens[(index + 1) % vaultTokens.length].token
                  .address as Address,
                chainId:
                  vaultTokens[(index + 1) % vaultTokens.length].token.chainId,
              },
            ]
          : [
              { address: token.address as Address, chainId: token.chainId },
            ]) satisfies EarnPool['exposureTokens'],
        token,
        totalDeposits: deposits[index] ?? BigInt(0),
        vaultAddress,
      }))
    },
    queryKey: ['hemi-earn', 'pools', chainId],
  })
}
