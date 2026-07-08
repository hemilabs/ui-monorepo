import { queryOptions } from '@tanstack/react-query'
import { getGateway } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { vaultAssetQueryOptions } from './vaultAsset'

// Gateway from the staking vault, following the Agent's walk: asset() → pegged token
// → gateway(); the asset() leg is shared so it runs once.
export const gatewayForRemoteShareQueryOptions = (remoteShare: Address) =>
  queryOptions({
    async queryFn({ client }) {
      const peggedToken = await client.ensureQueryData(
        vaultAssetQueryOptions(remoteShare),
      )
      return getGateway(getEvmL1PublicClient(mainnet.id), {
        address: peggedToken,
      })
    },
    queryKey: ['hemi-earn', 'gateway-for-remote-share', remoteShare],
    staleTime: Infinity,
  })
