'use client'

import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { isValidUrl } from 'utils/url'
import { type Address, type Chain } from 'viem'

import {
  type CompositionData,
  fetchComposition,
  toCompositionItems,
} from '../../../_fetchers/fetchComposition'

export type CompositionViewMode = 'token' | 'protocol'

export type CompositionItem = {
  amount: number
  isReserveBuffer: boolean
  name: string
  share: number
}

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL
const isVetroApiConfigured = apiUrl !== undefined && isValidUrl(apiUrl)

type CompositionQueryOptions = {
  chainId: Chain['id']
  queryClient: QueryClient
  shareAddress: Address
}

// The cached data is grouping-agnostic, so both view modes share one entry —
// `viewMode` only drives the `select` below and is kept out of the query key.
const compositionQueryOptions = ({
  chainId,
  queryClient,
  shareAddress,
}: CompositionQueryOptions) =>
  queryOptions({
    enabled: isVetroApiConfigured,
    // `enabled` guarantees the query only runs with a valid api url
    queryFn: () =>
      fetchComposition({ apiUrl: apiUrl!, queryClient, shareAddress }),
    queryKey: ['hemi-earn', 'composition', chainId, shareAddress],
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  })

type UseComposition = {
  chainId: Chain['id']
  shareAddress: Address
  viewMode: CompositionViewMode
}

export const useComposition = function ({
  chainId,
  shareAddress,
  viewMode,
}: UseComposition) {
  const queryClient = useQueryClient()
  const t = useTranslations('hemi-earn.pool.composition')

  return useQuery({
    ...compositionQueryOptions({
      chainId,
      queryClient,
      shareAddress,
    }),
    // The cached data is locale-free and ungrouped — the translated
    // reserve-buffer label, the per-mode grouping and the derived share
    // percentages are applied at render time.
    select: (data: CompositionData): CompositionItem[] =>
      toCompositionItems({
        data,
        reserveBufferLabel: t('reserve-buffer'),
        viewMode,
      }),
  })
}
