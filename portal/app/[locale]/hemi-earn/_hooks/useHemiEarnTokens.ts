'use client'

import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type EvmToken } from 'types/token'

import { fetchHemiEarnTokens } from '../_fetchers/fetchHemiEarnTokens'

export const useHemiEarnTokens = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery<EvmToken[]>({
    queryFn: () => fetchHemiEarnTokens({ chainId, client: hemiClient }),
    queryKey: ['hemi-earn-tokens', chainId],
    staleTime: Infinity,
  })
}
