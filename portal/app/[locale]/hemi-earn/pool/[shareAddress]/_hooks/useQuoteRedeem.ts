import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type QuoteRedeemHookParams,
  quoteRedeemOptions,
} from '../_fetchers/fetchQuoteRedeem'

export const useQuoteRedeem = (
  params: Omit<QuoteRedeemHookParams, 'queryClient'>,
) => useQuery(quoteRedeemOptions({ ...params, queryClient: useQueryClient() }))
