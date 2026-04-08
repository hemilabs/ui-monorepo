'use client'

import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { balanceOf, convertToAssets } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

import { type EarnPosition } from '../types'

import { useEarnPools } from './useEarnPools'

export const useEarnPositions = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { address } = useAccount()
  const { data: pools = [] } = useEarnPools()

  return useQuery<EarnPosition[]>({
    enabled: pools.length > 0 && !!address,
    async queryFn() {
      const balances = await Promise.all(
        pools.map(async function (pool) {
          const shares = await balanceOf(hemiClient, {
            account: address!,
            address: pool.vaultAddress,
          })

          if (shares === BigInt(0)) {
            return BigInt(0)
          }

          return convertToAssets(hemiClient, {
            address: pool.vaultAddress,
            shares,
          })
        }),
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
    queryKey: ['hemi-earn', 'positions', chainId, address],
  })
}
