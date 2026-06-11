import { type UseQueryOptions } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToAssets } from 'viem-erc4626/actions'

export type SharesToPegged = {
  peggedAmount: bigint
}

export type SharesToPeggedParams = {
  shareAddress: Address
  shares: bigint
}

// Pure share→pegged conversion via `StakingVault.convertToAssets`. Cached
// separately from the asset-specific leg so switching the withdraw asset
// (which only changes the gateway `previewRedeem` step) doesn't re-run
// this RPC.
export async function fetchSharesToPegged({
  shareAddress,
  shares,
}: SharesToPeggedParams): Promise<SharesToPegged> {
  if (shares <= BigInt(0)) {
    return { peggedAmount: BigInt(0) }
  }
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const peggedAmount = await convertToAssets(ethereumClient, {
    address: getStakingVaultForShare(shareAddress),
    shares,
  })
  return { peggedAmount: peggedAmount > BigInt(0) ? peggedAmount : BigInt(0) }
}

const getSharesToPeggedQueryKey = ({
  shareAddress,
  shares,
}: SharesToPeggedParams) =>
  ['hemi-earn', 'shares-to-pegged', shareAddress, shares.toString()] as const

export const sharesToPeggedOptions = (
  params: SharesToPeggedParams,
): UseQueryOptions<SharesToPegged> => ({
  enabled: params.shares > BigInt(0),
  queryFn: () => fetchSharesToPegged(params),
  queryKey: getSharesToPeggedQueryKey(params),
})
