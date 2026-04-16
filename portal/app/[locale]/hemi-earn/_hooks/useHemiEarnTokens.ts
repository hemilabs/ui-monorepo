'use client'

import { useQueries } from '@tanstack/react-query'
import { getEarnChainIds } from 'hemi-earn-actions'
import { type NetworkType, useNetworkType } from 'hooks/useNetworkType'
import { tokenQueryOptions } from 'hooks/useToken'
import { useMemo } from 'react'
import { findChainById } from 'utils/chain'
import { isEvmToken } from 'utils/token'
import { useConfig } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'

import { fetchHemiEarnTokens } from '../_fetchers/fetchHemiEarnTokens'
import { type VaultToken } from '../types'

const getEarnChainIdsByNetworkType = (networkType: NetworkType) =>
  getEarnChainIds().filter(function (chainId) {
    const chain = findChainById(chainId)
    return networkType === 'testnet' ? chain?.testnet : !chain?.testnet
  })

export const useHemiEarnTokens = function () {
  const [networkType] = useNetworkType()
  const config = useConfig()
  const earnChainIds = getEarnChainIdsByNetworkType(networkType)

  const vaultAssetQueries = useQueries({
    queries: earnChainIds.map(chainId => ({
      queryFn: () =>
        fetchHemiEarnTokens({
          chainId,
          client: getPublicClient(config, { chainId })!,
        }),
      queryKey: ['hemi-earn-tokens', chainId],
      staleTime: Infinity,
    })),
  })

  const vaultAssets = useMemo(
    () => vaultAssetQueries.flatMap(q => (q.isSuccess ? q.data : [])),
    [vaultAssetQueries],
  )

  const tokenQueries = useQueries({
    queries: vaultAssets.map(({ chainId, tokenAddress }) =>
      tokenQueryOptions({ address: tokenAddress, chainId, config }),
    ),
  })

  const isPending =
    vaultAssetQueries.every(q => q.isPending) ||
    (vaultAssets.length > 0 && tokenQueries.some(q => q.isPending))
  const isError =
    vaultAssetQueries.every(q => q.isError) ||
    (vaultAssets.length > 0 && tokenQueries.every(q => q.isError))

  const data: VaultToken[] | undefined =
    isPending || isError
      ? undefined
      : tokenQueries.reduce<VaultToken[]>(function (acc, query, index) {
          const token = query.data
          if (token !== undefined && isEvmToken(token)) {
            acc.push({ token, vaultAddress: vaultAssets[index].vaultAddress })
          }
          return acc
        }, [])

  return { data, isError, isPending }
}
