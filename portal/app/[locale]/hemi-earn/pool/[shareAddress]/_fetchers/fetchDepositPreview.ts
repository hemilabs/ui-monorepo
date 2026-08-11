import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import { depositSharesOptions } from './fetchDepositShares'
import { quoteDepositOptions } from './fetchQuoteDeposit'

type DepositPreviewParams = {
  account: Address | undefined
  amount: bigint
  asset: Address
  queryClient: QueryClient
  shareAddress: Address
  validInput: boolean
}

const getDepositPreviewQueryKey = ({
  account,
  amount,
  asset,
  shareAddress,
}: Omit<DepositPreviewParams, 'queryClient' | 'validInput'>) =>
  [
    'hemi-earn',
    'deposit-preview',
    shareAddress,
    asset,
    account,
    amount.toString(),
  ] as const

// Composes quote + deposit-shares. Allowance stays in useNeedsApproval so its error
// surfaces independently; sharesOutMin is derived in useDepositPreview so changing
// slippage doesn't invalidate on-chain reads it has no bearing on.
export const depositPreviewOptions = ({
  account,
  amount,
  asset,
  queryClient,
  shareAddress,
  validInput,
}: DepositPreviewParams) =>
  queryOptions({
    enabled: validInput && amount > BigInt(0) && !!account,
    async queryFn() {
      const [shares, quote] = await Promise.all([
        queryClient.ensureQueryData(
          depositSharesOptions({ amount, asset, shareAddress }),
        ),
        queryClient.ensureQueryData(
          quoteDepositOptions({ amount, asset, queryClient, shareAddress }),
        ),
      ])
      return { quote, shares }
    },
    queryKey: getDepositPreviewQueryKey({
      account,
      amount,
      asset,
      shareAddress,
    }),
  })
