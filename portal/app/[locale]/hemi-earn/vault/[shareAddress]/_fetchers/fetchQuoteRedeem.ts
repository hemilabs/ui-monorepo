import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  getAssetData,
  quoteRedeem,
  quoteRedeemFulfillment,
  resolveIsInstant,
} from '@vetro-protocol/hemi-earn/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { shareConfigQueryOptions } from '../../../_fetchers/fetchHemiEarnAssetConfigs'
import { agentAddressQueryOptions } from '../../../_hooks/useHemiEarnAgentAddress'

export type QuoteRedeem = {
  callbackFee: bigint
  isInstant: boolean
  nativeFee: bigint
}

export type QuoteRedeemParams = {
  account: Address
  asset: Address
  queryClient: QueryClient
  shareAddress: Address
  shares: bigint
}

// Resolves isInstant (Ethereum) → quoteRedeemFulfillment (Ethereum) → quoteRedeem (Hemi).
// Plain async so it stays callable outside react-query.
export async function fetchQuoteRedeem({
  account,
  asset,
  queryClient,
  shareAddress,
  shares,
}: QuoteRedeemParams): Promise<QuoteRedeem> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const hemiClient = getPublicClient(hemi.id)
  const { remoteShare } = await queryClient.ensureQueryData(
    shareConfigQueryOptions(shareAddress),
  )
  const [isInstant, assetData, agentAddress] = await Promise.all([
    resolveIsInstant(ethereumClient, {
      address: remoteShare,
      caller: account,
    }),
    getAssetData(hemiClient, { asset }),
    queryClient.ensureQueryData(agentAddressQueryOptions()),
  ])
  const callbackFee = await quoteRedeemFulfillment(ethereumClient, {
    address: agentAddress,
    remoteAsset: assetData.remoteAsset,
  })
  const nativeFee = await quoteRedeem(hemiClient, {
    asset,
    callbackFee,
    isInstant,
    shares,
  })
  return { callbackFee, isInstant, nativeFee }
}

export type QuoteRedeemHookParams = Omit<
  QuoteRedeemParams,
  'account' | 'queryClient'
> & {
  account: Address | undefined
}

const getQuoteRedeemQueryKey = ({
  account,
  asset,
  shareAddress,
  shares,
}: QuoteRedeemHookParams) =>
  [
    'hemi-earn',
    'quote-redeem',
    shareAddress,
    asset,
    account,
    shares.toString(),
  ] as const

export const quoteRedeemOptions = ({
  account,
  asset,
  shareAddress,
  shares,
}: QuoteRedeemHookParams): UseQueryOptions<QuoteRedeem> => ({
  enabled: shares > BigInt(0) && !!account,
  // The `enabled` flag above guarantees `account` is defined when this runs.
  queryFn: ({ client: queryClient }) =>
    fetchQuoteRedeem({
      account: account!,
      asset,
      queryClient,
      shareAddress,
      shares,
    }),
  queryKey: getQuoteRedeemQueryKey({ account, asset, shareAddress, shares }),
})
