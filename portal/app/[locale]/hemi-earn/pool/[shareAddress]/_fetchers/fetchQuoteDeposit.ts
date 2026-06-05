import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { previewDeposit } from '@vetro-protocol/gateway/actions'
import {
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
  getStakingVaultForShare,
} from 'hemi-earn-actions'
import {
  quoteDeposit,
  quoteDepositFulfillment,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { gatewayForAssetQueryOptions } from '../../../_hooks/gatewayForAsset'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'

export type QuoteDeposit = {
  callbackFee: bigint
  nativeFee: bigint
  peggedAmount: bigint
}

export type QuoteDepositParams = {
  amount: bigint
  asset: Address
  queryClient: QueryClient
  shareAddress: Address
}

// Plain async fetcher — react-query agnostic, so it can be called from any
// chained queryFn (via `queryClient.ensureQueryData(quoteDepositOptions(...))`),
// from server-side scripts, or unit-tested directly without mocking the
// react-query observer.
export async function fetchQuoteDeposit({
  amount,
  asset,
  queryClient,
  shareAddress,
}: QuoteDepositParams): Promise<QuoteDeposit> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const hemiClient = getPublicClient(hemi.id)

  const peggedAmountPromise = Promise.all([
    queryClient.ensureQueryData(gatewayForAssetQueryOptions(asset)),
    queryClient.ensureQueryData(assetDataQueryOptions(asset)),
  ]).then(([gateway, assetData]) =>
    previewDeposit(ethereumClient, {
      address: gateway,
      amountIn: amount,
      tokenIn: assetData.remoteAsset,
    }),
  )

  const callbackFeePromise = quoteDepositFulfillment({
    agentAddress: getHemiEarnAgentAddress(),
    client: ethereumClient,
    share: getStakingVaultForShare(shareAddress),
  })

  const [callbackFee, nativeFee, peggedAmount] = await Promise.all([
    callbackFeePromise,
    callbackFeePromise.then(cbFee =>
      quoteDeposit({
        asset,
        assets: amount,
        callbackFee: cbFee,
        client: hemiClient,
        routerAddress: getHemiEarnRouterAddress(),
      }),
    ),
    peggedAmountPromise,
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
