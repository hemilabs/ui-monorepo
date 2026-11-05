import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type VetroFeeParams,
  vetroFeeQueryOptions,
} from '../_fetchers/fetchVetroFee'

export const useVetroFee = (params: Omit<VetroFeeParams, 'queryClient'>) =>
  useQuery(vetroFeeQueryOptions({ ...params, queryClient: useQueryClient() }))
