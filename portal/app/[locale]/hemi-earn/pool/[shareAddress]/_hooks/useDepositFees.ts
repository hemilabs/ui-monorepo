import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useEstimateGas } from 'wagmi'

import { useQuoteDeposit } from './useQuoteDeposit'

type QuoteDeposit = {
  fulfillmentFee: bigint
  nativeFee: bigint
}

const buildGasData = ({
  amount,
  asset,
  canDeposit,
  quote,
  receiver,
}: {
  amount: bigint
  asset: Address
  canDeposit: boolean
  quote: QuoteDeposit | undefined
  receiver: Address | undefined
}) =>
  !canDeposit || !receiver || !quote
    ? undefined
    : encodeRequestDeposit({
        amount,
        asset,
        fulfillmentFee: quote.fulfillmentFee,
        receiver,
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

// Bundles every cost the user pays on a deposit:
//   - approval gas (Hemi, ERC-20 allowance to the Router)
//   - requestDeposit gas (Hemi, payable tx that triggers the LZ send)
//   - LayerZero native fee (`msg.value` forwarded to the Agent fulfillment)
// Owning the whole pipeline here keeps the Deposit form a thin orchestrator.
export const useDepositFees = function ({
  amount,
  asset,
  canDeposit,
  needsApproval,
  receiver,
  shareAddress,
  spender,
  token,
}: {
  amount: bigint
  asset: Address
  canDeposit: boolean
  needsApproval: boolean
  receiver: Address | undefined
  shareAddress: Address
  spender: Address
  token: EvmToken
}) {
  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({ amount, spender, token })

  const { data: quote, isError: isQuoteError } = useQuoteDeposit({
    amount,
    asset,
    shareAddress,
  })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data: buildGasData({ amount, asset, canDeposit, quote, receiver }),
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
    depositGasFees,
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isDepositGasFeesError,
      isQuoteError,
      needsApproval,
    }),
    layerZeroFee,
    quote,
    totalFees: computeTotalFees({
      approvalGasFees,
      depositGasFees,
      layerZeroFee,
      needsApproval,
    }),
  }
}
