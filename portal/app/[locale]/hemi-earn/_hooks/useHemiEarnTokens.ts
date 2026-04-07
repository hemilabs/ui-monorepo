'use client'

import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'

import { fetchHemiEarnTokens } from '../_fetchers/fetchHemiEarnTokens'
import { type VaultToken } from '../types'

export const useHemiEarnTokens = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery<VaultToken[]>({
    queryFn: () => fetchHemiEarnTokens({ chainId, client: hemiClient }),
    queryKey: ['hemi-earn-tokens', chainId],
    staleTime: Infinity,
  })
}
