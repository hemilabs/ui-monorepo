import { useQuery, useQueryClient } from '@tanstack/react-query'
import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import { depositPreviewOptions } from '../_fetchers/fetchDepositPreview'
import { type QuoteDeposit } from '../_fetchers/fetchQuoteDeposit'

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

const computeTotalFees = ({
  approvalGasFees,
  depositGasFees,
  layerZeroFee,
  needsApproval,
}: {
  approvalGasFees: bigint
  depositGasFees: bigint
  layerZeroFee: bigint
  needsApproval: boolean
}) =>
  depositGasFees + layerZeroFee + (needsApproval ? approvalGasFees : BigInt(0))

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

// Mirror of `useWithdrawPreview`: subscribes to the composed
// `depositPreviewOptions` (shares + quote) and pairs it with the
// canonical `useNeedsApproval` for allowance reads. Adds wagmi-side gas
// estimation on top.
export const useDepositPreview = function ({
  account,
  amount,
  asset,
  shareAddress,
  spender,
  token,
  validInput,
}: {
  account: Address | undefined
  amount: bigint
  asset: Address
  shareAddress: Address
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
  const sharesOutMin = composed?.sharesOutMin ?? BigInt(0)
  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

  // Gate submit on a positive shares preview. Without this, a fast submit
  // before the preview resolves would land `sharesOutMin=0n` on-chain —
  // zero slippage protection.
  // Also gate on `!isAllowanceLoading` so the fees summary can't render with
  // `needsApproval=false` while allowance is still pending (the total would
  // jump up once allowance settles).
  const canDeposit =
    validInput &&
    shares !== undefined &&
    shares > BigInt(0) &&
    !isAllowanceLoading

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: needsApproval,
      spender,
      token,
    })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data: buildGasData({
        amount,
        asset,
        canDeposit,
        quote,
        receiver: account,
        sharesOutMin,
      }),
      query: { enabled: canDeposit && !!account && !!quote },
      to: spender,
      value: quote?.nativeFee,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId: token.chainId,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
    })

  return {
    approvalGasFees,
    canDeposit,
    depositGasFees,
    isAllowanceError,
    isAllowanceLoading,
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isDepositGasFeesError,
      isPreviewError,
      needsApproval,
    }),
    isPreviewError,
    isPreviewLoading,
    layerZeroFee,
    needsApproval,
    quote,
    shares,
    sharesOutMin,
    totalFees: computeTotalFees({
      approvalGasFees,
      depositGasFees,
      layerZeroFee,
      needsApproval,
    }),
  }
}
