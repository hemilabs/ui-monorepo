'use client'

import { useQueries } from '@tanstack/react-query'
import { getHemiEarnSupportedAssets } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { tokenQueryOptions } from 'hooks/useToken'
import { isEvmToken } from 'utils/token'
import { zeroAddress } from 'viem'
import { useConfig } from 'wagmi'

import { type VaultToken } from '../types'

export const useHemiEarnTokens = function () {
  const config = useConfig()

  const vaultAssets = getHemiEarnSupportedAssets().filter(
    addr => addr !== zeroAddress,
  )

  const tokenQueries = useQueries({
    queries: vaultAssets.map(address =>
      tokenQueryOptions({ address, chainId: hemi.id, config }),
    ),
  })

  const isPending =
    vaultAssets.length > 0 && tokenQueries.some(q => q.isPending)
  const isError =
    !isPending && vaultAssets.length > 0 && tokenQueries.every(q => q.isError)

  const data: VaultToken[] | undefined =
    isPending || isError
      ? undefined
      : tokenQueries.reduce<VaultToken[]>(
          (acc, query, index) =>
            query.data && isEvmToken(query.data)
              ? acc.concat({
                  token: query.data,
                  vaultAddress: vaultAssets[index],
                })
              : acc,
          [],
        )

  return { data, isError, isPending }
}
