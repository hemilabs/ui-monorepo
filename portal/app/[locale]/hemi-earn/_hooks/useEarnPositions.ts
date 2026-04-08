'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Address, type Chain } from 'viem'
import { useAccount } from 'wagmi'

import { type EarnPosition } from '../types'
import { userVaultBalanceQueryOptions } from '../vault/[vaultAddress]/_hooks/useUserVaultBalance'

import { earnPoolsQueryOptions } from './useEarnPools'
import { useHemiEarnTokens } from './useHemiEarnTokens'

export const getEarnPositionsQueryKey = (
  chainId: Chain['id'],
  address: Address | undefined,
) => ['hemi-earn', 'positions', chainId, address]

export const useEarnPositions = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery<EarnPosition[]>({
    enabled: !!address && !!hemiClient && vaultTokens.length > 0,
    async queryFn() {
      const pools = await queryClient.ensureQueryData(
        earnPoolsQueryOptions({
          chainId,
          hemiClient: hemiClient!,
          vaultTokens,
        }),
      )

      const balances = await Promise.all(
        pools.map(pool =>
          queryClient.ensureQueryData(
            userVaultBalanceQueryOptions({
              address: address!,
              chainId,
              hemiClient: hemiClient!,
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
    },
    queryKey: getEarnPositionsQueryKey(chainId, address),
  })
}
