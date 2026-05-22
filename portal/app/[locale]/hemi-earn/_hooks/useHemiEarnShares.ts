'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { hemiEarnSharesQueryOptions } from '../_fetchers/fetchHemiEarnShares'

export const useHemiEarnShares = function () {
  const queryClient = useQueryClient()
  return useQuery(hemiEarnSharesQueryOptions({ queryClient }))
}
