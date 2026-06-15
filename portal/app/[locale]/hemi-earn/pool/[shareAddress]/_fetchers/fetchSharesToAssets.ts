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

// Converts a share amount to the asset units the user will receive on
// redeem. Composes the share→pegged query (`fetchSharesToPegged`,
// asset-agnostic) with the asset-specific gateway leg (`previewRedeem`),
// so switching the withdraw asset dropdown only re-runs the gateway step.
// `peggedAmount` is exposed because the redeem burns this many vault
// assets, letting `useWithdraw` optimistically subtract it from
// `totalAssets()` in the right unit.
// `fetchQuery` (not `ensureQueryData`) on the shares→pegged leg so a
// stale cached `peggedAmount` can't slip into `assetsOutMin` — vault
// price drift between mounts would otherwise produce a `requestRedeem`
// whose min is derived from an older `convertToAssets` than the one the
// user sees in the form. Mirrors `fetchDepositShares`.
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
