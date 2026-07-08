import { queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import { shareConfigQueryOptions } from '../_fetchers/fetchHemiEarnAssetConfigs'

import { gatewayForRemoteShareQueryOptions } from './gatewayForRemoteShare'

// The gateway is the same for all of a share's assets, so share-only callers resolve it from the share's staking vault.
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
    staleTime: Infinity,
  })
