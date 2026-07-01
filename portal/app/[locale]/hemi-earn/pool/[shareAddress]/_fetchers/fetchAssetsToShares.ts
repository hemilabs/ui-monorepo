import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { previewWithdraw } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'

import { gatewayForShareQueryOptions } from '../../../_hooks/gatewayForShare'
import { assetDataQueryOptions } from '../../../_hooks/useAssetData'

export type AssetsToShares = {
  peggedAmount: bigint
  shares: bigint
}

export type AssetsToSharesParams = {
  amount: bigint
  assetAddress: Address
  shareAddress: Address
}

export async function fetchAssetsToShares({
  amount,
  assetAddress,
  queryClient,
  shareAddress,
}: AssetsToSharesParams & {
  queryClient: QueryClient
}): Promise<AssetsToShares> {
  const [gateway, assetData] = await Promise.all([
    queryClient.ensureQueryData(gatewayForShareQueryOptions(shareAddress)),
    queryClient.ensureQueryData(assetDataQueryOptions(assetAddress)),
  ])
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const peggedAmount = await previewWithdraw(ethereumClient, {
    address: gateway,
    amountOut: amount,
    tokenOut: assetData.remoteAsset,
  })
  if (peggedAmount <= BigInt(0)) {
    return { peggedAmount: BigInt(0), shares: BigInt(0) }
  }
  const shares = await convertToShares(ethereumClient, {
    address: assetData.remoteShare,
    assets: peggedAmount,
  })
  return { peggedAmount, shares }
}

const getAssetsToSharesQueryKey = ({
  amount,
  assetAddress,
  shareAddress,
}: AssetsToSharesParams) =>
  [
    'hemi-earn',
    'assets-to-shares',
    shareAddress,
    assetAddress,
    amount.toString(),
  ] as const

export const assetsToSharesOptions = (
  params: AssetsToSharesParams,
): UseQueryOptions<AssetsToShares> => ({
  enabled: params.amount > BigInt(0),
  queryFn: ({ client: queryClient }) =>
    fetchAssetsToShares({ ...params, queryClient }),
  queryKey: getAssetsToSharesQueryKey(params),
})
