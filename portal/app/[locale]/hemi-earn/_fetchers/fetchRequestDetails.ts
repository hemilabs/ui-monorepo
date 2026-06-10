import { getRequestDetails } from '@vetro-protocol/earn/actions'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

export const requestDetailsKeyPrefix = ['hemi-earn', 'request-details'] as const

export type RequestDetails = {
  owner: Address
  assets: bigint
  // Unix-seconds timestamp at which the Vetro Agent (Ethereum-side) will
  // allow the auto/manual claim to fire. Set the moment the Agent
  // observes the LayerZero request and never changes afterward —
  // preferring this over a local `initiatedAt + cooldownDuration`
  // calculation removes the LayerZero-delay drift between when the user
  // signed on Hemi and when the cooldown actually started ticking on
  // Ethereum.
  claimableAt: bigint
}

// Reads Vetro-side details for a redeem request. The Hemi subgraph
// exposes `requestId` + `initiatedAt`, but the cooldown timer actually
// starts on Ethereum at Agent-observation time — `claimableAt` is the
// only authoritative source. Cached forever (Infinity) by the consuming
// hook since the value is immutable after observation.
export const fetchRequestDetails = ({
  requestId,
  shareAddress,
}: {
  requestId: bigint | string
  shareAddress: Address
}): Promise<RequestDetails> =>
  getRequestDetails(getEvmL1PublicClient(mainnet.id), {
    address: getStakingVaultForShare(shareAddress),
    requestId: BigInt(requestId),
  })
