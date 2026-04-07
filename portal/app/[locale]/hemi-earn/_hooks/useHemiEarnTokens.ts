'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { tokenQueryOptions } from 'hooks/useToken'
import { isEvmToken } from 'utils/token'
import { useConfig } from 'wagmi'

import { fetchHemiEarnTokens } from '../_fetchers/fetchHemiEarnTokens'
import { type VaultToken } from '../types'

export const useHemiEarnTokens = function () {
  const { id: chainId } = useHemi()
  const config = useConfig()
  const hemiClient = useHemiClient()

  const { data: vaultAssets = [] } = useQuery({
    queryFn: () => fetchHemiEarnTokens({ chainId, client: hemiClient }),
    queryKey: ['hemi-earn-tokens', chainId],
    staleTime: Infinity,
  })

  const tokenQueries = useQueries({
    queries: vaultAssets.map(({ tokenAddress }) =>
      tokenQueryOptions({ address: tokenAddress, chainId, config }),
    ),
  })

  const isPending = tokenQueries.some(q => q.isPending)
  const isError = tokenQueries.some(q => q.isError)

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
