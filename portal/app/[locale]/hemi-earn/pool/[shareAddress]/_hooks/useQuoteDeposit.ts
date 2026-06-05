import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type QuoteDepositParams,
  quoteDepositOptions,
} from '../_fetchers/fetchQuoteDeposit'

export const useQuoteDeposit = (
  params: Omit<QuoteDepositParams, 'queryClient'>,
) => useQuery(quoteDepositOptions({ ...params, queryClient: useQueryClient() }))
