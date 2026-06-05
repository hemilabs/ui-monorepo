import { useQuery } from '@tanstack/react-query'

import {
  type QuoteDepositParams,
  quoteDepositOptions,
} from '../_fetchers/fetchQuoteDeposit'

export const useQuoteDeposit = (params: QuoteDepositParams) =>
  useQuery(quoteDepositOptions(params))
