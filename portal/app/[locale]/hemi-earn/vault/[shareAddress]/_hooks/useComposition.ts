import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslations } from 'use-intl'
import { type Address, type Chain } from 'viem'

import {
  type CompositionData,
  fetchComposition,
  toCompositionItems,
} from '../../../_fetchers/fetchComposition'

export type CompositionViewMode = 'token' | 'protocol'

// amount is in the pegged token's base units; share is a fraction (0-1), as returned by Vetro.
export type CompositionItem = {
  amount: bigint
  isReserveBuffer: boolean
  name: string
  share: number
}

type CompositionQueryOptions = {
  chainId: Chain['id']
  queryClient: QueryClient
  stakingVault: Address
}

// Cache is grouping-agnostic; viewMode only drives the select below, so it's out of the query key.
const compositionQueryOptions = ({
  chainId,
  queryClient,
  stakingVault,
}: CompositionQueryOptions) =>
  queryOptions({
    queryFn: () =>
      fetchComposition({
        apiUrl: import.meta.env.VITE_VETRO_API_URL,
        queryClient,
        stakingVault,
      }),
    queryKey: ['hemi-earn', 'composition', chainId, stakingVault],
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  })

type UseComposition = {
  chainId: Chain['id']
  stakingVault: Address
  viewMode: CompositionViewMode
}

export const useComposition = function ({
  chainId,
  stakingVault,
  viewMode,
}: UseComposition) {
  const queryClient = useQueryClient()
  const t = useTranslations('hemi-earn.vault.composition')

  return useQuery({
    ...compositionQueryOptions({
      chainId,
      queryClient,
      stakingVault,
    }),
    // Cache is locale-free and ungrouped; translation + grouping happen here at render time.
    select: (data: CompositionData): CompositionItem[] =>
      toCompositionItems({
        data,
        reserveBufferLabel: t('reserve-buffer'),
        viewMode,
      }),
  })
}
