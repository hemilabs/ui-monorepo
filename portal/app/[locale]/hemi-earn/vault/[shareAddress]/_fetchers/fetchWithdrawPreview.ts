import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import { quoteRedeemOptions } from './fetchQuoteRedeem'
import { sharesToAssetsOptions } from './fetchSharesToAssets'

type WithdrawPreviewParams = {
  account: Address | undefined
  asset: Address
  queryClient: QueryClient
  shareAddress: Address
  shares: bigint
  validInput: boolean
}

const getWithdrawPreviewQueryKey = ({
  account,
  asset,
  shareAddress,
  shares,
}: Omit<WithdrawPreviewParams, 'queryClient' | 'validInput'>) =>
  [
    'hemi-earn',
    'withdraw-preview',
    shareAddress,
    asset,
    account,
    shares.toString(),
  ] as const

// Composes sharesToAssets + redeem quote into one subscription. Allowance stays in useNeedsApproval
// so its error surfaces independently; assetOut freshness is handled by fetchSharesToAssets' fetchQuery,
// and assetsOutMin is derived in useWithdrawPreview so slippage doesn't invalidate on-chain reads.
export const withdrawPreviewOptions = ({
  account,
  asset,
  queryClient,
  shareAddress,
  shares,
  validInput,
}: WithdrawPreviewParams) =>
  queryOptions({
    enabled: validInput && shares > BigInt(0) && !!account,
    async queryFn() {
      const [sharesToAssets, quote] = await Promise.all([
        queryClient.ensureQueryData(
          sharesToAssetsOptions({
            assetAddress: asset,
            queryClient,
            shareAddress,
            shares,
          }),
        ),
        queryClient.ensureQueryData(
          quoteRedeemOptions({
            account,
            asset,
            shareAddress,
            shares,
          }),
        ),
      ])
      return {
        assetOut: sharesToAssets.assetOut,
        peggedAmount: sharesToAssets.peggedAmount,
        quote,
      }
    },
    queryKey: getWithdrawPreviewQueryKey({
      account,
      asset,
      shareAddress,
      shares,
    }),
  })
