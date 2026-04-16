'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { useAccount, useConfig } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'

import { type EarnPosition } from '../types'
import { userVaultBalanceQueryOptions } from '../vault/[vaultAddress]/_hooks/useUserVaultBalance'

import { earnPoolsQueryOptions } from './useEarnPools'
import { useHemiEarnTokens } from './useHemiEarnTokens'

export const earnPositionsKeyPrefix = ['hemi-earn', 'positions']

export const useEarnPositions = function () {
  const [networkType] = useNetworkType()
  const { address } = useAccount()
  const config = useConfig()
  const queryClient = useQueryClient()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery<EarnPosition[]>({
    enabled: !!address && vaultTokens.length > 0,
    async queryFn() {
      const allPositions = await Promise.all(
        Array.from(
          Map.groupBy(vaultTokens, vt => vt.token.chainId).entries(),
        ).map(async function ([chainId, tokens]) {
          const client = getPublicClient(config, { chainId })!

          const pools = await queryClient.ensureQueryData(
            earnPoolsQueryOptions({
              chainId,
              client,
              vaultTokens: tokens,
            }),
          )

          const balances = await Promise.all(
            pools.map(pool =>
              queryClient.ensureQueryData(
                userVaultBalanceQueryOptions({
                  address: address!,
                  chainId,
                  client,
                  vaultAddress: pool.vaultAddress,
                }),
              ),
            ),
          )

          return pools
            .map((pool, index) => ({
              apy: pool.apy,
              token: pool.token,
              vaultAddress: pool.vaultAddress,
              // TODO: yield earned requires off-chain data once available
              yieldEarned: '-',
              yourDeposit: balances[index] ?? BigInt(0),
            }))
            .filter(position => position.yourDeposit > BigInt(0))
        }),
      )

      return allPositions.flat()
    },
    queryKey: [
      ...earnPositionsKeyPrefix,
      networkType,
      address,
      vaultTokens.map(vt => vt.vaultAddress),
    ],
  })
}
