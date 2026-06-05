import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import {
  DEPOSIT_SLIPPAGE_BPS,
  applySlippage,
} from '../../../_constants/slippage'

type QuoteDeposit = {
  callbackFee: bigint
  nativeFee: bigint
}

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
  isQuoteError,
  needsApproval,
}: {
  isApprovalGasFeesError: boolean
  isDepositGasFeesError: boolean
  isQuoteError: boolean
  needsApproval: boolean
}) =>
  isDepositGasFeesError ||
  isQuoteError ||
  (needsApproval && isApprovalGasFeesError)

// Takes `quote` and `shares` from the caller — the Deposit form owns those
// preview queries so it can subscribe once. The hook derives `canDeposit` and
// `sharesOutMin` internally so the slippage policy lives in one place (mirror
// of `useWithdrawFees`).
export const useDepositFees = function ({
  amount,
  asset,
  isQuoteError,
  needsApproval,
  quote,
  receiver,
  shares,
  spender,
  token,
  validInput,
}: {
  amount: bigint
  asset: Address
  isQuoteError: boolean
  needsApproval: boolean
  quote: QuoteDeposit | undefined
  receiver: Address | undefined
  shares: bigint | undefined
  spender: Address
  token: EvmToken
  validInput: boolean
}) {
  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({ amount, spender, token })

  // Gate submit on a positive shares preview. Without this, a fast submit
  // before the preview resolves would land `sharesOutMin=0n` on-chain —
  // zero slippage protection.
  const canDeposit = validInput && shares !== undefined && shares > BigInt(0)
  const sharesOutMin = applySlippage(shares ?? BigInt(0), DEPOSIT_SLIPPAGE_BPS)

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data: buildGasData({
        amount,
        asset,
        canDeposit,
        quote,
        receiver,
        sharesOutMin,
      }),
      query: { enabled: canDeposit && !!receiver && !!quote },
      to: spender,
      value: quote?.nativeFee,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId: token.chainId,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
    })

  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

  return {
    approvalGasFees,
    canDeposit,
    depositGasFees,
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isDepositGasFeesError,
      isQuoteError,
      needsApproval,
    }),
    layerZeroFee,
    sharesOutMin,
    totalFees: computeTotalFees({
      approvalGasFees,
      depositGasFees,
      layerZeroFee,
      needsApproval,
    }),
  }
}
