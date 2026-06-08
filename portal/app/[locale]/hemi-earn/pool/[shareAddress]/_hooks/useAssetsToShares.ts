import { useQuery } from '@tanstack/react-query'

import {
  type AssetsToSharesParams,
  assetsToSharesOptions,
} from '../_fetchers/fetchAssetsToShares'

export const useAssetsToShares = (params: AssetsToSharesParams) =>
  useQuery(assetsToSharesOptions(params))
