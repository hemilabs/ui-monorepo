import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type SharesToAssetsParams,
  sharesToAssetsOptions,
} from '../_fetchers/fetchSharesToAssets'

export const useSharesToAssets = (
  params: Omit<SharesToAssetsParams, 'queryClient'>,
) =>
  useQuery(sharesToAssetsOptions({ ...params, queryClient: useQueryClient() }))
