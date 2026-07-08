import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { previewRedeem } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { sharesToPeggedOptions } from '../../../_fetchers/fetchSharesToPegged'
import { gatewayForShareQueryOptions } from '../../../_hooks/gatewayForShare'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'

export type SharesToAssets = {
  assetOut: bigint
  peggedAmount: bigint
}

export type SharesToAssetsParams = {
  assetAddress: Address
  queryClient: QueryClient
  shareAddress: Address
  shares: bigint
}

// share→asset for redeem. Composes the asset-agnostic share→pegged leg with the gateway
// previewRedeem, so switching the asset only re-runs the gateway step. peggedAmount is exposed
// so useWithdraw can optimistically debit the user's share value. fetchQuery (not ensureQueryData) on the
// share→pegged leg keeps a stale peggedAmount out of assetsOutMin.
export async function fetchSharesToAssets({
  assetAddress,
  queryClient,
  shareAddress,
  shares,
}: SharesToAssetsParams): Promise<SharesToAssets> {
  const { queryFn: sharesToPeggedQueryFn, queryKey: sharesToPeggedQueryKey } =
    sharesToPeggedOptions({ shareAddress, shares })
  const [{ peggedAmount }, gateway, assetData] = await Promise.all([
    queryClient.fetchQuery({
      queryFn: sharesToPeggedQueryFn,
      queryKey: sharesToPeggedQueryKey,
    }),
    queryClient.ensureQueryData(gatewayForShareQueryOptions(shareAddress)),
    queryClient.ensureQueryData(assetDataQueryOptions(assetAddress)),
  ])
  if (peggedAmount <= BigInt(0)) {
    return { assetOut: BigInt(0), peggedAmount: BigInt(0) }
  }
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const assetOut = await previewRedeem(ethereumClient, {
    address: gateway,
    peggedTokenIn: peggedAmount,
    tokenOut: assetData.remoteAsset,
  })
  return { assetOut, peggedAmount }
}

const getSharesToAssetsQueryKey = ({
  assetAddress,
  shareAddress,
  shares,
}: SharesToAssetsParams) =>
  [
    'hemi-earn',
    'shares-to-assets',
    shareAddress,
    assetAddress,
    shares.toString(),
  ] as const

export const sharesToAssetsOptions = (
  params: SharesToAssetsParams,
): UseQueryOptions<SharesToAssets> => ({
  enabled: params.shares > BigInt(0),
  queryFn: () => fetchSharesToAssets(params),
  queryKey: getSharesToAssetsQueryKey(params),
})
