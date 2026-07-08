import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { previewDeposit } from '@vetro-protocol/gateway/actions'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import {
  quoteDeposit,
  quoteDepositFulfillment,
} from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { shareConfigQueryOptions } from '../../../_fetchers/fetchHemiEarnAssetConfigs'
import { gatewayForShareQueryOptions } from '../../../_hooks/gatewayForShare'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'
import { agentAddressQueryOptions } from '../../../_hooks/useHemiEarnAgentAddress'

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

// Plain async (react-query agnostic) so it's callable from chained queryFns, server scripts, or unit tests.
export async function fetchQuoteDeposit({
  amount,
  asset,
  queryClient,
  shareAddress,
}: QuoteDepositParams): Promise<QuoteDeposit> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const hemiClient = getPublicClient(hemi.id)

  const peggedAmountPromise = Promise.all([
    queryClient.ensureQueryData(gatewayForShareQueryOptions(shareAddress)),
    queryClient.ensureQueryData(assetDataQueryOptions(asset)),
  ]).then(([gateway, assetData]) =>
    previewDeposit(ethereumClient, {
      address: gateway,
      amountIn: amount,
      tokenIn: assetData.remoteAsset,
    }),
  )

  const callbackFeePromise = Promise.all([
    queryClient.ensureQueryData(agentAddressQueryOptions()),
    queryClient
      .ensureQueryData(shareConfigQueryOptions(shareAddress))
      .then(({ remoteShare }) => remoteShare),
  ]).then(([agentAddress, remoteShare]) =>
    quoteDepositFulfillment({
      agentAddress,
      client: ethereumClient,
      share: remoteShare,
    }),
  )

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

const getQuoteDepositQueryKey = ({
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
