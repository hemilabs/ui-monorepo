import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type AssetsToSharesParams,
  assetsToSharesOptions,
} from '../_fetchers/fetchAssetsToShares'

export const useAssetsToShares = (
  params: Omit<AssetsToSharesParams, 'queryClient'>,
) =>
  useQuery(assetsToSharesOptions({ ...params, queryClient: useQueryClient() }))
