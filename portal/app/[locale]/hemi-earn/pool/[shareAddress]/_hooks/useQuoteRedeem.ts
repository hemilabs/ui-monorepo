import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import {
  type QuoteRedeemHookParams,
  quoteRedeemOptions,
} from '../_fetchers/fetchQuoteRedeem'

export const useQuoteRedeem = (
  params: Omit<QuoteRedeemHookParams, 'account'>,
) =>
  useQuery(
    quoteRedeemOptions({
      ...params,
      account: useAccount().address,
    }),
  )
