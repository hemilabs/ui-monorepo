import { useQuery } from '@tanstack/react-query'

import {
  type DepositSharesParams,
  depositSharesOptions,
} from '../_fetchers/fetchDepositShares'

export const useDepositShares = (params: DepositSharesParams) =>
  useQuery(depositSharesOptions(params))
