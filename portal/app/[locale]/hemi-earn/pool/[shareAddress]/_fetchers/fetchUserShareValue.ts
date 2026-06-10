import { type UseQueryOptions } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient, getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'
import { convertToAssets } from 'viem-erc4626/actions'

export type UserShareValue = {
  peggedAmount: bigint
  shares: bigint
}

export type UserShareValueParams = {
  account: Address | undefined
  shareAddress: Address
}

// Reads the user's share OFT balance on Hemi and converts it to vault
// pegged-token units via `StakingVault.convertToAssets`. Independent of the
// withdraw asset selection — the share figure and pegged value are stable
// against dropdown changes. `peggedAmount` is the right input for the fiat
// preview because it follows `pricePerShare`, so accumulated yield is
// reflected naturally instead of being collapsed to a flat 1:1 mapping.
export async function fetchUserShareValue({
  account,
  shareAddress,
}: UserShareValueParams): Promise<UserShareValue> {
  if (!account) {
    return { peggedAmount: BigInt(0), shares: BigInt(0) }
  }
  const shares = await balanceOf(getPublicClient(hemi.id), {
    account,
    address: shareAddress,
  })
  if (shares <= BigInt(0)) {
    return { peggedAmount: BigInt(0), shares: BigInt(0) }
  }
  const peggedAmount = await convertToAssets(getEvmL1PublicClient(mainnet.id), {
    address: getStakingVaultForShare(shareAddress),
    shares,
  })
  return { peggedAmount, shares }
}

export const getUserShareValueQueryKey = ({
  account,
  shareAddress,
}: UserShareValueParams) =>
  ['hemi-earn', 'user-share-value', hemi.id, account, shareAddress] as const

export const userShareValueOptions = (
  params: UserShareValueParams,
): UseQueryOptions<UserShareValue> => ({
  enabled: !!params.account,
  queryFn: () => fetchUserShareValue(params),
  queryKey: getUserShareValueQueryKey(params),
})
