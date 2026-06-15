import { queryOptions } from '@tanstack/react-query'
import { type Address, isAddressEqual } from 'viem'

import { hemiEarnAssetConfigsQueryOptions } from '../_fetchers/fetchHemiEarnAssetConfigs'

// `Router.assetsData(asset)` on Hemi — resolves a Hemi-side asset to its
// Ethereum-side counterparts (`remoteShare` = staking vault, `remoteAsset`).
// Served from the cached on-chain asset-config list (which already read
// `assetsData` for every registered asset) so the deposit/withdraw flows don't
// re-issue the same per-asset RPC.
export const assetDataQueryOptions = (asset: Address) =>
  queryOptions({
    async queryFn({ client }) {
      const configs = await client.ensureQueryData(
        hemiEarnAssetConfigsQueryOptions(),
      )
      const config = configs.find(c => isAddressEqual(c.asset, asset))
      if (config === undefined) {
        throw new Error(`Asset not registered in Hemi Earn: ${asset}`)
      }
      return config
    },
    queryKey: ['hemi-earn', 'asset-data', asset],
    staleTime: Infinity,
  })
