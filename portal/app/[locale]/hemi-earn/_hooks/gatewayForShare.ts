import { queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import { shareConfigQueryOptions } from '../_fetchers/fetchHemiEarnAssetConfigs'

import { gatewayForRemoteShareQueryOptions } from './gatewayForRemoteShare'

// The gateway is identical across all of a share's deposit assets, so callers
// that only have a share OFT (e.g. composition) resolve it from the share's
// staking vault (`remoteShare`) via the cached asset-config list.
export const gatewayForShareQueryOptions = (shareAddress: Address) =>
  queryOptions({
    async queryFn({ client }) {
      const { remoteShare } = await client.ensureQueryData(
        shareConfigQueryOptions(shareAddress),
      )
      return client.ensureQueryData(
        gatewayForRemoteShareQueryOptions(remoteShare),
      )
    },
    queryKey: ['hemi-earn', 'gateway-for-share', shareAddress],
  })
