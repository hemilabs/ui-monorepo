import { useQuery } from '@tanstack/react-query'

import {
  type QuoteRedeemHookParams,
  quoteRedeemOptions,
} from '../_fetchers/fetchQuoteRedeem'

export const useQuoteRedeem = (params: QuoteRedeemHookParams) =>
  useQuery(quoteRedeemOptions(params))
