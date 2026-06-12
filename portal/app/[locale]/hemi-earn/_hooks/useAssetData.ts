import { queryOptions } from '@tanstack/react-query'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { getAssetData } from 'hemi-earn-actions/actions'
import { getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { hemi } from 'viem/chains'

// `Router.assetsData(asset)` on Hemi — resolves a Hemi-side asset to its
// Ethereum-side counterparts (`remoteShare` = staking vault, `remoteAsset`).
export const assetDataQueryOptions = (asset: Address) =>
  queryOptions({
    queryFn: () =>
      getAssetData(getPublicClient(hemi.id), {
        asset,
        routerAddress: getHemiEarnRouterAddress(),
      }),
    queryKey: ['hemi-earn', 'asset-data', asset],
  })
