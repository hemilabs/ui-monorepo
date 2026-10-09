import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import { applySlippage } from '../../../_constants/slippage'
import { depositPreviewOptions } from '../_fetchers/fetchDepositPreview'
import { type QuoteDeposit } from '../_fetchers/fetchQuoteDeposit'
import { computeCrossChainFees } from '../_utils/crossChainFees'
import { createFeeEstimateStateOverride } from '../_utils/feeEstimateStateOverride'
import { areFeesPending } from '../_utils/formState'

const buildGasData = ({
  amount,
  asset,
  canDeposit,
  quote,
  receiver,
  sharesOutMin,
}: {
  amount: bigint
  asset: Address
  canDeposit: boolean
  quote: QuoteDeposit | undefined
  receiver: Address | undefined
  sharesOutMin: bigint
}) =>
  !canDeposit || !receiver || !quote
    ? undefined
    : encodeRequestDeposit({
        amount,
        asset,
        callbackFee: quote.callbackFee,
        operator: receiver,
        receiver,
        sharesOutMin,
      })

// Gas never resolves to exactly 0, so a 0 leg means that estimate is still loading.
const computeHemiGasFee = function ({
  approvalGasFees,
  depositGasFees,
  needsApproval,
}: {
  approvalGasFees: bigint
  depositGasFees: bigint
  needsApproval: boolean
}) {
  if (depositGasFees === BigInt(0)) {
    return undefined
  }
  if (needsApproval && approvalGasFees === BigInt(0)) {
    return undefined
  }
  return depositGasFees + (needsApproval ? approvalGasFees : BigInt(0))
}

const computeTotalFees = ({
  hemiGasFee,
  layerZeroFee,
}: {
  hemiGasFee: bigint | undefined
  layerZeroFee: bigint
}) => (hemiGasFee === undefined ? undefined : hemiGasFee + layerZeroFee)

const computeIsFeesError = ({
  isApprovalGasFeesError,
  isDepositGasFeesError,
  isPreviewError,
  needsApproval,
}: {
  isApprovalGasFeesError: boolean
  isDepositGasFeesError: boolean
  isPreviewError: boolean
  needsApproval: boolean
}) =>
  isDepositGasFeesError ||
  isPreviewError ||
  (needsApproval && isApprovalGasFeesError)

// Composed depositPreviewOptions (shares + quote) + useNeedsApproval for allowance, plus gas estimation.
export const useDepositPreview = function ({
  account,
  amount,
  approvalAmount,
  asset,
  shareAddress,
  slippageBps,
  spender,
  token,
  validInput,
}: {
  account: Address | undefined
  amount: bigint
  approvalAmount: bigint
  asset: Address
  shareAddress: Address
  slippageBps: bigint
  spender: Address
  token: EvmToken
  validInput: boolean
}) {
  const queryClient = useQueryClient()

  const {
    data: composed,
    isError: isPreviewError,
    isLoading: isPreviewLoading,
  } = useQuery(
    depositPreviewOptions({
      account,
      amount,
      asset,
      queryClient,
      shareAddress,
      validInput,
    }),
  )

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: asset,
      amount,
      chainId: token.chainId,
      spender,
    })

  const shares = composed?.shares
  const quote = composed?.quote
  const sharesOutMin =
    shares === undefined ? BigInt(0) : applySlippage(shares, slippageBps)
  const layerZeroFee = quote?.nativeFee ?? BigInt(0)
  const { bridgingFee, ethereumFee } = computeCrossChainFees({
    layerZeroFee,
    quote,
  })

  // Gate on a positive shares preview (else a fast submit lands sharesOutMin=0n — no slippage
  // protection) and on !isAllowanceLoading (else the fee total jumps once allowance settles).
  const canDeposit =
    validInput &&
    shares !== undefined &&
    shares > BigInt(0) &&
    !isAllowanceLoading

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: approvalAmount,
      enabled: needsApproval,
      spender,
      token,
    })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      chainId: token.chainId,
      data: buildGasData({
        amount,
        asset,
        canDeposit,
        quote,
        receiver: account,
        sharesOutMin,
      }),
      query: { enabled: canDeposit && !!account && !!quote },
      stateOverride: createFeeEstimateStateOverride({
        needsApproval,
        owner: account,
        spender,
        token,
      }),
      to: spender,
      value: quote?.nativeFee,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId: token.chainId,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
    })

  const hemiGasFee = computeHemiGasFee({
    approvalGasFees,
    depositGasFees,
    needsApproval,
  })
  const totalFees = computeTotalFees({ hemiGasFee, layerZeroFee })
  const isFeesError = computeIsFeesError({
    isApprovalGasFeesError,
    isDepositGasFeesError,
    isPreviewError,
    needsApproval,
  })

  return {
    bridgingFee,
    canDeposit,
    depositGasFees,
    ethereumFee,
    feesPending: areFeesPending({
      canSubmit: canDeposit,
      isFeesError,
      totalFees,
    }),
    hemiGasFee,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError,
    isPreviewError,
    isPreviewLoading,
    layerZeroFee,
    needsApproval,
    quote,
    shares,
    sharesOutMin,
    totalFees,
  }
}
