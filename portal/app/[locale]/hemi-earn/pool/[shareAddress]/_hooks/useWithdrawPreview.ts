import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import { applySlippage } from '../../../_constants/slippage'
import { type QuoteRedeem } from '../_fetchers/fetchQuoteRedeem'
import { withdrawPreviewOptions } from '../_fetchers/fetchWithdrawPreview'
import { computeCrossChainFees } from '../_utils/crossChainFees'
import { createFeeEstimateStateOverride } from '../_utils/feeEstimateStateOverride'
import { areFeesPending } from '../_utils/formState'

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

// Gas never resolves to exactly 0, so a 0 leg means that estimate is still loading.
const computeHemiGasFees = function ({
  approvalGasFees,
  needsApproval,
  withdrawGasFees,
}: {
  approvalGasFees: bigint
  needsApproval: boolean
  withdrawGasFees: bigint
}) {
  if (withdrawGasFees === BigInt(0)) {
    return undefined
  }
  if (needsApproval && approvalGasFees === BigInt(0)) {
    return undefined
  }
  return withdrawGasFees + (needsApproval ? approvalGasFees : BigInt(0))
}

const computeTotalFees = ({
  hemiGasFees,
  layerZeroFee,
}: {
  hemiGasFees: bigint | undefined
  layerZeroFee: bigint
}) => (hemiGasFees === undefined ? undefined : hemiGasFees + layerZeroFee)

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

// Composed withdrawPreviewOptions (sharesToAssets + quoteRedeem) + useNeedsApproval so an
// allowance failure is distinguishable from a preview failure, plus gas estimation.
export const useWithdrawPreview = function ({
  account,
  approvalAmount,
  asset,
  shareAddress,
  shares,
  shareToken,
  slippageBps,
  spender,
  validInput,
}: {
  account: Address | undefined
  approvalAmount: bigint
  asset: Address
  shareAddress: Address
  shareToken: EvmToken
  shares: bigint
  slippageBps: bigint
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
  // assetOut already defaults to 0n, which applySlippage maps back to 0n.
  const assetsOutMin = applySlippage(assetOut, slippageBps)
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
      amount: approvalAmount,
      enabled: needsApproval,
      spender,
      token: shareToken,
    })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      chainId: shareToken.chainId,
      data: buildGasData({
        asset,
        assetsOutMin,
        canWithdraw,
        quote,
        receiver: account,
        shares,
      }),
      query: { enabled: canWithdraw && !!account && !!quote },
      stateOverride: createFeeEstimateStateOverride({
        needsApproval,
        owner: account,
        spender,
        token: shareToken,
      }),
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
  const hemiGasFees = computeHemiGasFees({
    approvalGasFees,
    needsApproval,
    withdrawGasFees,
  })
  const totalFees = computeTotalFees({ hemiGasFees, layerZeroFee })
  const isFeesError = computeIsFeesError({
    isApprovalGasFeesError,
    isPreviewError,
    isWithdrawGasFeesError,
    needsApproval,
  })

  return {
    assetOut,
    assetOutRaw: composed?.assetOut,
    assetsOutMin,
    bridgingFee,
    canWithdraw,
    ethereumFee,
    feesPending: areFeesPending({
      canSubmit: canWithdraw,
      isFeesError,
      totalFees,
    }),
    hemiGasFees,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError,
    isPreviewError,
    isPreviewLoading,
    needsApproval,
    peggedAmount,
    peggedAmountRaw: composed?.peggedAmount,
    quote,
    totalFees,
  }
}
