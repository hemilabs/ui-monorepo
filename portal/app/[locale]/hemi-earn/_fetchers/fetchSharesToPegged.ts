import { type UseQueryOptions } from '@tanstack/react-query'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToAssets } from 'viem-erc4626/actions'

import { shareConfigQueryOptions } from './fetchHemiEarnAssetConfigs'

export type SharesToPegged = {
  peggedAmount: bigint
}

export type SharesToPeggedParams = {
  shareAddress: Address
  shares: bigint
}

// share→pegged via StakingVault.convertToAssets. Cached separately from the asset
// leg so switching the withdraw asset doesn't re-run this RPC.
export async function fetchSharesToPegged({
  shares,
  stakingVault,
}: {
  shares: bigint
  stakingVault: Address
}): Promise<SharesToPegged> {
  if (shares <= BigInt(0)) {
    return { peggedAmount: BigInt(0) }
  }
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const peggedAmount = await convertToAssets(ethereumClient, {
    address: stakingVault,
    shares,
  })
  return { peggedAmount: peggedAmount > BigInt(0) ? peggedAmount : BigInt(0) }
}

const getSharesToPeggedQueryKey = ({
  shareAddress,
  shares,
}: SharesToPeggedParams) =>
  ['hemi-earn', 'shares-to-pegged', shareAddress, shares.toString()] as const

export const sharesToPeggedOptions = ({
  shareAddress,
  shares,
}: SharesToPeggedParams): UseQueryOptions<SharesToPegged> => ({
  enabled: shares > BigInt(0),
  async queryFn({ client }) {
    const { remoteShare } = await client.ensureQueryData(
      shareConfigQueryOptions(shareAddress),
    )
    return fetchSharesToPegged({ shares, stakingVault: remoteShare })
  },
  queryKey: getSharesToPeggedQueryKey({ shareAddress, shares }),
})
