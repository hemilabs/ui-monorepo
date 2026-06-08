import { type UseQueryOptions } from '@tanstack/react-query'
import { previewWithdraw } from '@vetro-protocol/gateway/actions'
import { getGatewayForShare, getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'

export type AssetsToShares = {
  peggedAmount: bigint
  shares: bigint
}

export type AssetsToSharesParams = {
  amount: bigint
  assetAddress: Address
  shareAddress: Address
}

// Converts the user-entered asset amount to share units. The Router expects
// shares in the StakingVault's units, but the input is in the deposit
// asset's units (USDC, cbBTC, …). Uses the Gateway's `previewWithdraw` —
// the canonical inverse of `previewRedeem` — so the redeem fee is applied
// on-chain instead of approximated client-side.
//
// `peggedAmount` is the intermediate pegged-token value — exposed because
// the redeem also burns this many vault assets, which lets `useWithdraw`
// optimistically subtract it from `totalAssets()` in the right unit.
export async function fetchAssetsToShares({
  amount,
  assetAddress,
  shareAddress,
}: AssetsToSharesParams): Promise<AssetsToShares> {
  const ethereumClient = getEvmL1PublicClient(mainnet.id)
  const peggedAmount = await previewWithdraw(ethereumClient, {
    address: getGatewayForShare(shareAddress),
    amountOut: amount,
    tokenOut: assetAddress,
  })
  if (peggedAmount <= BigInt(0)) {
    return { peggedAmount: BigInt(0), shares: BigInt(0) }
  }
  const shares = await convertToShares(ethereumClient, {
    address: getStakingVaultForShare(shareAddress),
    assets: peggedAmount,
  })
  return { peggedAmount, shares }
}

const getAssetsToSharesQueryKey = ({
  amount,
  assetAddress,
  shareAddress,
}: AssetsToSharesParams) =>
  [
    'hemi-earn',
    'assets-to-shares',
    shareAddress,
    assetAddress,
    amount.toString(),
  ] as const

export const assetsToSharesOptions = (
  params: AssetsToSharesParams,
): UseQueryOptions<AssetsToShares> => ({
  enabled: params.amount > BigInt(0),
  queryFn: () => fetchAssetsToShares(params),
  queryKey: getAssetsToSharesQueryKey(params),
})
