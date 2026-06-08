import { type QueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'

import { quoteDepositOptions } from './fetchQuoteDeposit'

export type DepositSharesParams = {
  amount: bigint
  asset: Address
  shareAddress: Address
}

// `fetchQuery` (not `ensureQueryData`) so a stale cached `peggedAmount`
// can't slip into `sharesOutMin` — gateway drift between mounts would
// otherwise produce a `requestDeposit` whose min is derived from an
// older quote than the one the user sees in the form.
export async function fetchDepositShares(
  queryClient: QueryClient,
  { amount, asset, shareAddress }: DepositSharesParams,
): Promise<bigint> {
  const { queryFn, queryKey } = quoteDepositOptions({
    amount,
    asset,
    queryClient,
    shareAddress,
  })
  const quote = await queryClient.fetchQuery({ queryFn, queryKey })
  if (quote.peggedAmount <= BigInt(0)) {
    return BigInt(0)
  }
  return convertToShares(getEvmL1PublicClient(mainnet.id), {
    address: getStakingVaultForShare(shareAddress),
    assets: quote.peggedAmount,
  })
}

const getDepositSharesQueryKey = ({
  amount,
  asset,
  shareAddress,
}: DepositSharesParams) =>
  [
    'hemi-earn',
    'deposit-shares',
    shareAddress,
    asset,
    amount.toString(),
  ] as const

export const depositSharesOptions = (
  queryClient: QueryClient,
  params: DepositSharesParams,
): UseQueryOptions<bigint> => ({
  enabled: params.amount > BigInt(0),
  queryFn: () => fetchDepositShares(queryClient, params),
  queryKey: getDepositSharesQueryKey(params),
})
