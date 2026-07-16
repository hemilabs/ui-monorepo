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

// nativeFee already bundles the Agent's Ethereum-side callback, so the bridging portion is what's left.
const computeCrossChainFees = function ({
  layerZeroFee,
  quote,
}: {
  layerZeroFee: bigint
  quote: QuoteRedeem | undefined
}) {
  const ethereumFee = quote?.callbackFee ?? BigInt(0)
  return { bridgingFee: layerZeroFee - ethereumFee, ethereumFee }
}

// Composed withdrawPreviewOptions (sharesToAssets + quoteRedeem) + useNeedsApproval so an
// allowance failure is distinguishable from a preview failure, plus gas estimation.
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
  const { bridgingFee, ethereumFee } = computeCrossChainFees({
    layerZeroFee,
    quote,
  })

  // Gate on !isAllowanceLoading so the fee total doesn't render (and then jump) while allowance is still pending.
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

  // *Raw fields keep undefined (for skeletons) while loading; the bigint aliases default to 0n for hooks that can't take undefined.
  return {
    assetOut,
    assetOutRaw: composed?.assetOut,
    assetsOutMin,
    bridgingFee,
    canWithdraw,
    ethereumFee,
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
