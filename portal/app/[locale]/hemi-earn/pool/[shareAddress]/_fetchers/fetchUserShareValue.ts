import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { getPublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'

import { sharesToPeggedOptions } from './fetchSharesToPegged'

export type UserShareValue = {
  peggedAmount: bigint
  shares: bigint
}

export type UserShareValueParams = {
  account: Address | undefined
  queryClient: QueryClient
  shareAddress: Address
}

// Reads the user's share OFT balance on Hemi and converts it to vault
// pegged-token units via `sharesToPeggedOptions`. Independent of the
// withdraw asset selection; `peggedAmount` follows `pricePerShare`, so
// accumulated yield is reflected naturally in the fiat preview.
export async function fetchUserShareValue({
  account,
  queryClient,
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
  const { peggedAmount } = await queryClient.ensureQueryData(
    sharesToPeggedOptions({ shareAddress, shares }),
  )
  return { peggedAmount, shares }
}

export const getUserShareValueQueryKey = ({
  account,
  shareAddress,
}: Omit<UserShareValueParams, 'queryClient'>) =>
  ['hemi-earn', 'user-share-value', hemi.id, account, shareAddress] as const

export const userShareValueOptions = (
  params: UserShareValueParams,
): UseQueryOptions<UserShareValue> => ({
  enabled: !!params.account,
  queryFn: () => fetchUserShareValue(params),
  queryKey: getUserShareValueQueryKey(params),
})
