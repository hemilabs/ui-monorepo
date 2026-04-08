'use client'

import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Address, type Chain, type PublicClient } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

import { type EarnPool, type VaultToken } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const getEarnPoolsQueryKey = (chainId: Chain['id']) => [
  'hemi-earn',
  'pools',
  chainId,
]

export const earnPoolsQueryOptions = ({
  chainId,
  hemiClient,
  vaultTokens,
}: {
  chainId: Chain['id']
  hemiClient: PublicClient
  vaultTokens: VaultToken[]
}) =>
  queryOptions<EarnPool[]>({
    async queryFn() {
      const deposits = await Promise.all(
        vaultTokens.map(({ vaultAddress }) =>
          totalAssets(hemiClient, { address: vaultAddress }),
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
    queryKey: getEarnPoolsQueryKey(chainId),
  })

export const useEarnPools = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery({
    ...earnPoolsQueryOptions({ chainId, hemiClient: hemiClient!, vaultTokens }),
    enabled: vaultTokens.length > 0,
  })
}
