import { queryOptions } from '@tanstack/react-query'
import { getHemiEarnSupportedAssets } from 'hemi-earn-actions'
import { type Address, isAddressEqual } from 'viem'

import { gatewayForRemoteShareQueryOptions } from './gatewayForRemoteShare'
import { assetDataQueryOptions } from './useAssetData'

// Resolves the gateway for a Hemi-side deposit asset dynamically:
//   Router.assetsData(asset).remoteShare (Hemi)
//     → StakingVault.asset() (Ethereum)
//     → PeggedToken.gateway() (Ethereum)
// Composes the asset-data and remote-share lookups through the query cache so
// each is shared (e.g. `useQuoteDeposit` reuses the same asset-data entry).
export const gatewayForAssetQueryOptions = (asset: Address) =>
  queryOptions({
    async queryFn({ client }) {
      const { remoteShare } = await client.ensureQueryData(
        assetDataQueryOptions(asset),
      )
      return client.ensureQueryData(
        gatewayForRemoteShareQueryOptions(remoteShare),
      )
    },
    queryKey: ['hemi-earn', 'gateway-for-asset', asset],
  })

// The gateway is identical across all of a share's deposit assets, so callers
// that only have a share OFT (e.g. composition) resolve any registered asset
// for that share to feed the asset-keyed gateway lookup.
export const getAssetForShare = function (shareAddress: Address) {
  const entry = getHemiEarnSupportedAssets().find(supported =>
    isAddressEqual(supported.share, shareAddress),
  )
  if (!entry) {
    throw new Error(`No supported asset registered for share ${shareAddress}`)
  }
  return entry.asset
}
