import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'

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

// Composes the two preview reads the withdraw form needs (shares → asset
// preview + redeem quote) into a single query so the call site only deals
// with one subscription. Allowance/needsApproval are intentionally NOT in
// this composition — they live in `useNeedsApproval` so the form can
// surface a real allowance failure independently from a preview/quote
// failure. Freshness of the on-chain slippage min (`assetsOutMin`) is
// guaranteed inside `fetchSharesToAssets`, which uses `fetchQuery` on the
// shares→pegged sub-leg so a stale cached `peggedAmount` cannot slip in.
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
            queryClient,
            shareAddress,
            shares,
          }),
        ),
      ])
      return {
        assetOut: sharesToAssets.assetOut,
        assetsOutMin: applySlippage(
          sharesToAssets.assetOut,
          REDEEM_SLIPPAGE_BPS,
        ),
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
