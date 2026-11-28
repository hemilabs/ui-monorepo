import { useQuery } from '@tanstack/react-query'

import {
  type VetroFeeParams,
  vetroFeeQueryOptions,
} from '../_fetchers/fetchVetroFee'

export const useVetroFee = (params: VetroFeeParams) =>
  useQuery(vetroFeeQueryOptions(params))
