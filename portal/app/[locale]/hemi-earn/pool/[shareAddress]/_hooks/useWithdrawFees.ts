import { useQuery } from '@tanstack/react-query'
import { getGatewayForShare, getStakingVaultForShare } from 'hemi-earn-actions'
import {
  encodeRequestRedeem,
  inversePreviewRedeem,
} from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { mainnet } from 'networks/mainnet'
import { type EvmToken } from 'types/token'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { useEstimateGas } from 'wagmi'

import { useQuoteRedeem } from './useQuoteRedeem'

type QuoteRedeem = {
  fulfillmentFee: bigint
  nativeFee: bigint
}

// Converts the user-entered asset amount to share units. The Router expects
// shares in the StakingVault's units, but the input is in the deposit
// asset's units (USDC, cbBTC, …). Inverts the redeem pipeline rather than
// reusing `previewDeposit`: the deposit path applies `mintFee` while the
// redeem path applies `redeemFee`, and when those differ the two preview
// functions are not inverses of each other, so reusing `previewDeposit`
// silently miscomputes the shares to burn. `inversePreviewRedeem` probes
// `previewRedeem` once and self-calibrates against whatever the Gateway's
// fee model actually is.
//
// `peggedAmount` is the intermediate pegged-token value — exposed because
// the redeem also burns this many vault assets, which lets `useWithdraw`
// optimistically subtract it from `totalAssets()` in the right unit.
export const useAssetsToShares = ({
  amount,
  assetAddress,
  shareAddress,
}: {
  amount: bigint
  assetAddress: Address
  shareAddress: Address
}) =>
  useQuery({
    enabled: amount > BigInt(0),
    async queryFn() {
      const ethereumClient = getEvmL1PublicClient(mainnet.id)
      const peggedAmount = await inversePreviewRedeem({
        amount,
        client: ethereumClient,
        gatewayAddress: getGatewayForShare(shareAddress),
        tokenOut: assetAddress,
      })
      if (peggedAmount <= BigInt(0)) {
        return { peggedAmount: BigInt(0), shares: BigInt(0) }
      }
      const shares = await convertToShares(ethereumClient, {
        address: getStakingVaultForShare(shareAddress),
        assets: peggedAmount,
      })
      return { peggedAmount, shares }
    },
    queryKey: [
      'hemi-earn',
      'asset-to-shares',
      shareAddress,
      assetAddress,
      amount.toString(),
    ],
  })

const buildGasData = ({
  asset,
  canWithdraw,
  quote,
  receiver,
  shares,
}: {
  asset: Address
  canWithdraw: boolean
  quote: QuoteRedeem | undefined
  receiver: Address | undefined
  shares: bigint
}) =>
  !canWithdraw || !receiver || !quote
    ? undefined
    : encodeRequestRedeem({
        asset,
        fulfillmentFee: quote.fulfillmentFee,
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

// Mirror of `useDepositFees`: approval gas (share OFT → Router), requestRedeem
// gas, and the LayerZero native fee paid as `msg.value`.
export const useWithdrawFees = function ({
  asset,
  canWithdraw,
  chainId,
  needsApproval,
  receiver,
  shares,
  shareToken,
  spender,
}: {
  asset: Address
  canWithdraw: boolean
  chainId: EvmToken['chainId']
  needsApproval: boolean
  receiver: Address | undefined
  shares: bigint
  shareToken: EvmToken
  spender: Address
}) {
  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: shares,
      spender,
      token: shareToken,
    })

  const { data: quote, isError: isQuoteError } = useQuoteRedeem({
    asset,
    shares: canWithdraw ? shares : BigInt(0),
  })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data: buildGasData({
        asset,
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
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isQuoteError,
      isWithdrawGasFeesError,
      needsApproval,
    }),
    layerZeroFee,
    quote,
    totalFees: computeTotalFees({
      approvalGasFees,
      layerZeroFee,
      needsApproval,
      withdrawGasFees,
    }),
    withdrawGasFees,
  }
}
