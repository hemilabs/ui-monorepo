import { queryOptions } from '@tanstack/react-query'
import { getGateway } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { vaultAssetQueryOptions } from './vaultAsset'

// Resolves the Ethereum-side Vetro Gateway from the Ethereum-side StakingVault
// (the Router's `remoteShare`), following the chain the Agent walks:
// `StakingVault.asset()` → pegged token, then `PeggedToken.gateway()` → gateway.
// The `asset()` leg is shared with `vaultAssetQueryOptions` so it runs once.
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
