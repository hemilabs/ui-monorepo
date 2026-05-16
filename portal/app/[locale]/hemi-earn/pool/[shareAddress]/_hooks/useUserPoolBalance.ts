import { useQuery } from '@tanstack/react-query'
import { getGatewayForShare, getStakingVaultForShare } from 'hemi-earn-actions'
import { previewGatewayRedeem } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getHemiClient } from 'utils/chainClients'
import { type Address, type Chain } from 'viem'
import { balanceOf } from 'viem-erc20/actions'
import { convertToAssets } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

export function getUserPoolBalanceQueryKey({
  account,
  assetAddress,
  chainId,
  shareAddress,
}: {
  account: Address | undefined
  assetAddress?: Address
  chainId: Chain['id'] | undefined
  shareAddress: Address
}) {
  const base = [
    'hemi-earn',
    'user-pool-balance',
    chainId,
    account,
    shareAddress,
  ]
  return assetAddress ? [...base, assetAddress] : base
}

type UserPoolBalance = {
  // Amount of `assetAddress` the user would receive if they redeemed all
  // their shares now. Computed via `StakingVault.convertToAssets` (shares →
  // peggedToken) followed by `Gateway.previewRedeem` (peggedToken → asset),
  // so it's asset-denominated and gateway-fee-adjusted. The right value to
  // power the withdraw input's MAX button and validation.
  assetOut: bigint
  // Raw share OFT balance on Hemi (shareToken.decimals). Useful when the UI
  // wants to surface the share figure alongside the asset figure.
  shares: bigint
}

// Reads the user's share OFT balance on Hemi and translates it into the
// asset they have currently selected for the withdraw flow. The conversion
// is asset-specific because the gateway can swap the underlying pegged
// token for any whitelisted asset (USDC, USDT, hemiBTC, …) at potentially
// different fees — so the MAX a user can withdraw is per-asset.
export const useUserPoolBalance = function ({
  assetAddress,
  shareAddress,
}: {
  assetAddress: Address
  shareAddress: Address
}) {
  const chainId = hemi.id
  const { address } = useAccount()

  return useQuery<UserPoolBalance>({
    enabled: !!address,
    async queryFn() {
      const shares = await balanceOf(getHemiClient(chainId), {
        account: address!,
        address: shareAddress,
      })
      if (shares <= BigInt(0)) {
        return { assetOut: BigInt(0), shares: BigInt(0) }
      }
      const ethereumClient = getEvmL1PublicClient(mainnet.id)
      const peggedAmount = await convertToAssets(ethereumClient, {
        address: getStakingVaultForShare(shareAddress),
        shares,
      })
      if (peggedAmount <= BigInt(0)) {
        return { assetOut: BigInt(0), shares }
      }
      const assetOut = await previewGatewayRedeem({
        client: ethereumClient,
        gatewayAddress: getGatewayForShare(shareAddress),
        peggedTokenIn: peggedAmount,
        tokenOut: assetAddress,
      })
      return { assetOut, shares }
    },
    queryKey: getUserPoolBalanceQueryKey({
      account: address,
      assetAddress,
      chainId,
      shareAddress,
    }),
  })
}
