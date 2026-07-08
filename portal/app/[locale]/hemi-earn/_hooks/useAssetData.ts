import { queryOptions } from '@tanstack/react-query'
import { type Address, isAddressEqual } from 'viem'

import { hemiEarnAssetConfigsQueryOptions } from '../_fetchers/fetchHemiEarnAssetConfigs'

// Hemi asset → its Ethereum counterparts (remoteShare = staking vault, remoteAsset),
// served from the cached config list so the flows don't re-issue the per-asset RPC.
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
