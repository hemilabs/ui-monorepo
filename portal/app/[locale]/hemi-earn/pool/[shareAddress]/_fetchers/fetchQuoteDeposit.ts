import { type UseQueryOptions } from '@tanstack/react-query'
import { previewDeposit } from '@vetro-protocol/gateway/actions'
import {
  getGatewayForShare,
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
  getStakingVaultForShare,
} from 'hemi-earn-actions'
import {
  getAssetData,
  quoteDeposit,
  quoteDepositFulfillment,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

export type QuoteDeposit = {
  callbackFee: bigint
  nativeFee: bigint
  peggedAmount: bigint
}

export type QuoteDepositParams = {
  amount: bigint
  asset: Address
  shareAddress: Address
}

// Plain async fetcher — react-query agnostic, so it can be called from any
// chained queryFn (via `queryClient.ensureQueryData(quoteDepositOptions(...))`),
// from server-side scripts, or unit-tested directly without mocking the
// react-query observer.
export async function fetchQuoteDeposit({
  amount,
  asset,
  shareAddress,
}: QuoteDepositParams): Promise<QuoteDeposit> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const hemiClient = getPublicClient(hemi.id)
  const [callbackFee, assetData] = await Promise.all([
    quoteDepositFulfillment({
      agentAddress: getHemiEarnAgentAddress(),
      client: ethereumClient,
      share: getStakingVaultForShare(shareAddress),
    }),
    getAssetData({
      asset,
      client: hemiClient,
      routerAddress: getHemiEarnRouterAddress(),
    }),
  ])
  const [nativeFee, peggedAmount] = await Promise.all([
    quoteDeposit({
      asset,
      assets: amount,
      callbackFee,
      client: hemiClient,
      routerAddress: getHemiEarnRouterAddress(),
    }),
    previewDeposit(ethereumClient, {
      address: getGatewayForShare(shareAddress),
      amountIn: amount,
      tokenIn: assetData.remoteAsset,
    }),
  ])
  return { callbackFee, nativeFee, peggedAmount }
}

export const getQuoteDepositQueryKey = ({
  amount,
  asset,
  shareAddress,
}: QuoteDepositParams) =>
  [
    'hemi-earn',
    'quote-deposit',
    shareAddress,
    asset,
    amount.toString(),
  ] as const

export const quoteDepositOptions = (
  params: QuoteDepositParams,
): UseQueryOptions<QuoteDeposit> => ({
  enabled: params.amount > BigInt(0),
  queryFn: () => fetchQuoteDeposit(params),
  queryKey: getQuoteDepositQueryKey(params),
})
