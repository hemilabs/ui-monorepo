import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { previewRedeem } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import {
  gatewayForAssetQueryOptions,
  getAssetForShare,
} from '../../../_hooks/gatewayForAsset'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'

import { sharesToPeggedOptions } from './fetchSharesToPegged'

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
// redeem. Composes the cached share→pegged query (`fetchSharesToPegged`,
// asset-agnostic) with the asset-specific gateway leg (`previewRedeem`),
// so switching the withdraw asset dropdown only re-runs the gateway step.
// `peggedAmount` is exposed because the redeem burns this many vault
// assets, letting `useWithdraw` optimistically subtract it from
// `totalAssets()` in the right unit.
export async function fetchSharesToAssets({
  assetAddress,
  queryClient,
  shareAddress,
  shares,
}: SharesToAssetsParams): Promise<SharesToAssets> {
  const { peggedAmount } = await queryClient.ensureQueryData(
    sharesToPeggedOptions({ shareAddress, shares }),
  )
  if (peggedAmount <= BigInt(0)) {
    return { assetOut: BigInt(0), peggedAmount: BigInt(0) }
  }

  const [gateway, assetData] = await Promise.all([
    queryClient.ensureQueryData(
      gatewayForAssetQueryOptions(getAssetForShare(shareAddress)),
    ),
    queryClient.ensureQueryData(assetDataQueryOptions(assetAddress)),
  ])
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
