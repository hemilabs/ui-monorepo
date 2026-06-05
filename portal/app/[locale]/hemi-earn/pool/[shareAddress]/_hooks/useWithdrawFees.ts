import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'

type QuoteRedeem = {
  callbackFee: bigint
  isInstant: boolean
  nativeFee: bigint
}

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

const computeIsFeesError = ({
  isApprovalGasFeesError,
  isQuoteError,
  isWithdrawGasFeesError,
  needsApproval,
}: {
  isApprovalGasFeesError: boolean
  isQuoteError: boolean
  isWithdrawGasFeesError: boolean
  needsApproval: boolean
}) =>
  isWithdrawGasFeesError ||
  isQuoteError ||
  (needsApproval && isApprovalGasFeesError)

// Takes `quote` and `shares` from the caller — the Withdraw form owns those
// preview queries so it can subscribe once. The hook derives `canWithdraw`
// and `assetsOutMin` internally so the slippage policy lives in one place.
// Returns only what `withdraw.tsx` consumes: the deposit form needs the
// approval split for separate rendering, but the withdraw form renders a
// single "Total gas fee" with the split already folded into `totalFees`.
export const useWithdrawFees = function ({
  amount,
  asset,
  chainId,
  isQuoteError,
  needsApproval,
  quote,
  receiver,
  shares,
  shareToken,
  spender,
  validInput,
}: {
  amount: bigint
  asset: Address
  chainId: EvmToken['chainId']
  isQuoteError: boolean
  needsApproval: boolean
  quote: QuoteRedeem | undefined
  receiver: Address | undefined
  shares: bigint
  shareToken: EvmToken
  spender: Address
  validInput: boolean
}) {
  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: shares,
      spender,
      token: shareToken,
    })

  const canWithdraw = validInput && shares > BigInt(0)
  const assetsOutMin = applySlippage(amount, REDEEM_SLIPPAGE_BPS)

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data: buildGasData({
        asset,
        assetsOutMin,
        canWithdraw,
        quote,
        receiver,
        shares,
      }),
      query: { enabled: canWithdraw && !!receiver && !!quote },
      to: spender,
      value: quote?.nativeFee,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

  return {
    assetsOutMin,
    canWithdraw,
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isQuoteError,
      isWithdrawGasFeesError,
      needsApproval,
    }),
    totalFees: computeTotalFees({
      approvalGasFees,
      layerZeroFee,
      needsApproval,
      withdrawGasFees,
    }),
  }
}
