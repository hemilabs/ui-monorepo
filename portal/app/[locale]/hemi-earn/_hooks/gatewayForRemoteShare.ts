import { queryOptions } from '@tanstack/react-query'
import { getGateway } from '@vetro-protocol/gateway/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address, type Client } from 'viem'
import { asset as getVaultAsset } from 'viem-erc4626/actions'

// Resolves the Ethereum-side Vetro Gateway from the Ethereum-side StakingVault
// (the Router's `remoteShare`), following the chain the Agent walks:
// `StakingVault.asset()` → pegged token, then `PeggedToken.gateway()` → gateway.
// Both reads hit Ethereum.
const getGatewayFromRemoteShare = async function (
  ethereumClient: Client,
  remoteShare: Address,
): Promise<Address> {
  const peggedToken = await getVaultAsset(ethereumClient, {
    address: remoteShare,
  })
  return getGateway(ethereumClient, { address: peggedToken })
}

export const gatewayForRemoteShareQueryOptions = (remoteShare: Address) =>
  queryOptions({
    queryFn: () =>
      getGatewayFromRemoteShare(getEvmL1PublicClient(mainnet.id), remoteShare),
    queryKey: ['hemi-earn', 'gateway-for-remote-share', remoteShare],
  })
