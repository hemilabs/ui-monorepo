import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import { type QuoteRedeem } from '../_fetchers/fetchQuoteRedeem'
import { withdrawPreviewOptions } from '../_fetchers/fetchWithdrawPreview'

const buildGasData = ({
  asset,
  assetsOutMin,
  canWithdraw,
  quote,
  receiver,
  shares,
}: {
  asset: Address
  assetsOutMin: bigint
  canWithdraw: boolean
  quote: QuoteRedeem | undefined
  receiver: Address | undefined
  shares: bigint
}) =>
  !canWithdraw || !receiver || !quote
    ? undefined
    : encodeRequestRedeem({
        asset,
        assetsOutMin,
        callbackFee: quote.callbackFee,
        isInstant: quote.isInstant,
        operator: receiver,
        receiver,
        shares,
      })

const computeTotalFees = ({
  approvalGasFees,
  layerZeroFee,
  needsApproval,
  withdrawGasFees,
}: {
  approvalGasFees: bigint
  layerZeroFee: bigint
  needsApproval: boolean
  withdrawGasFees: bigint
}) =>
  withdrawGasFees + layerZeroFee + (needsApproval ? approvalGasFees : BigInt(0))

const computeHemiGasFees = ({
  approvalGasFees,
  needsApproval,
  withdrawGasFees,
}: {
  approvalGasFees: bigint
  needsApproval: boolean
  withdrawGasFees: bigint
}) => withdrawGasFees + (needsApproval ? approvalGasFees : BigInt(0))

const computeIsFeesError = ({
  isApprovalGasFeesError,
  isPreviewError,
  isWithdrawGasFeesError,
  needsApproval,
}: {
  isApprovalGasFeesError: boolean
  isPreviewError: boolean
  isWithdrawGasFeesError: boolean
  needsApproval: boolean
}) =>
  isWithdrawGasFeesError ||
  isPreviewError ||
  (needsApproval && isApprovalGasFeesError)

// Subscribes to a single composed query (`withdrawPreviewOptions`) that
// fans out `sharesToAssets` + `quoteRedeem` via `ensureQueryData`, and
// pairs it with the canonical `useNeedsApproval` for allowance reads so
// the form can tell an allowance failure apart from a preview failure.
// Adds the wagmi-side gas estimation on top.
export const useWithdrawPreview = function ({
  account,
  asset,
  shareAddress,
  shares,
  shareToken,
  spender,
  validInput,
}: {
  account: Address | undefined
  asset: Address
  shareAddress: Address
  shareToken: EvmToken
  shares: bigint
  spender: Address
  validInput: boolean
}) {
  const queryClient = useQueryClient()

  const {
    data: composed,
    isError: isPreviewError,
    isLoading: isPreviewLoading,
  } = useQuery(
    withdrawPreviewOptions({
      account,
      asset,
      queryClient,
      shareAddress,
      shares,
      validInput,
    }),
  )

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: shareAddress,
      amount: shares,
      chainId: shareToken.chainId,
      spender,
    })

  const assetOut = composed?.assetOut ?? BigInt(0)
  const peggedAmount = composed?.peggedAmount ?? BigInt(0)
  const assetsOutMin = composed?.assetsOutMin ?? BigInt(0)
  const quote = composed?.quote
  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

  // Gate on `!isAllowanceLoading` so the fees summary (driven by canWithdraw)
  // can't render with `needsApproval=false` while allowance is still pending —
  // otherwise the user sees a wrong total that jumps up once allowance settles.
  const canWithdraw =
    validInput &&
    shares > BigInt(0) &&
    assetOut > BigInt(0) &&
    !isAllowanceLoading

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: shares,
      enabled: needsApproval,
      spender,
      token: shareToken,
    })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data: buildGasData({
        asset,
        assetsOutMin,
        canWithdraw,
        quote,
        receiver: account,
        shares,
      }),
      query: { enabled: canWithdraw && !!account && !!quote },
      to: spender,
      value: quote?.nativeFee,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId: shareToken.chainId,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  // `*Raw` fields preserve `undefined` while the composed query is loading
  // so the summary can render a skeleton; the bigint aliases default to 0n
  // for hooks that don't tolerate undefined (e.g. `useWithdraw`'s
  // optimistic decrements).
  return {
    assetOut,
    assetOutRaw: composed?.assetOut,
    assetsOutMin,
    canWithdraw,
    hemiGasFees: computeHemiGasFees({
      approvalGasFees,
      needsApproval,
      withdrawGasFees,
    }),
    isAllowanceError,
    isAllowanceLoading,
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isPreviewError,
      isWithdrawGasFeesError,
      needsApproval,
    }),
    isPreviewError,
    isPreviewLoading,
    layerZeroFee,
    needsApproval,
    peggedAmount,
    peggedAmountRaw: composed?.peggedAmount,
    quote,
    totalFees: computeTotalFees({
      approvalGasFees,
      layerZeroFee,
      needsApproval,
      withdrawGasFees,
    }),
  }
}
