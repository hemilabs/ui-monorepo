import { useQuery } from '@tanstack/react-query'
import { previewWithdraw } from '@vetro-protocol/gateway/actions'
import { getGatewayForShare, getStakingVaultForShare } from 'hemi-earn-actions'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
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
  callbackFee: bigint
  isInstant: boolean
  nativeFee: bigint
}

// Converts the user-entered asset amount to share units. The Router expects
// shares in the StakingVault's units, but the input is in the deposit
// asset's units (USDC, cbBTC, …). Uses the Gateway's `previewWithdraw` —
// the canonical inverse of `previewRedeem` — so the redeem fee is applied
// on-chain instead of approximated client-side.
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
      const peggedAmount = await previewWithdraw(ethereumClient, {
        address: getGatewayForShare(shareAddress),
        amountOut: amount,
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

// Mirror of `useDepositFees`: approval gas (share OFT → Router), requestRedeem
// gas, and the LayerZero native fee paid as `msg.value`.
export const useWithdrawFees = function ({
  asset,
  assetsOutMin,
  canWithdraw,
  chainId,
  needsApproval,
  receiver,
  shareAddress,
  shares,
  shareToken,
  spender,
}: {
  asset: Address
  assetsOutMin: bigint
  canWithdraw: boolean
  chainId: EvmToken['chainId']
  needsApproval: boolean
  receiver: Address | undefined
  // Hemi-side share OFT for the pool. Forwarded to `useQuoteRedeem` so it
  // can resolve the staking vault on Ethereum for the `isInstant` check.
  shareAddress: Address
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

  const {
    data: quote,
    isError: isQuoteError,
    isLoading: isQuoteLoading,
  } = useQuoteRedeem({
    account: receiver,
    asset,
    shareAddress,
    shares: canWithdraw ? shares : BigInt(0),
  })

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
    isFeesError: computeIsFeesError({
      isApprovalGasFeesError,
      isQuoteError,
      isWithdrawGasFeesError,
      needsApproval,
    }),
    isQuoteError,
    isQuoteLoading,
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
