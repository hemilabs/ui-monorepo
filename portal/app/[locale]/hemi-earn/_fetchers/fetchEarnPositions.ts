import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { getHemiClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { balanceOf } from 'viem-erc20/actions'

import { type EarnPosition } from '../types'

import { hemiEarnSharesQueryOptions } from './fetchHemiEarnShares'

export const earnPositionsKeyPrefix = ['hemi-earn', 'positions']

const shareBalanceQueryOptions = ({
  account,
  networkType,
  shareAddress,
}: {
  account: Address
  networkType: string
  shareAddress: Address
}) =>
  queryOptions({
    queryFn: () =>
      balanceOf(getHemiClient(hemi.id), {
        account,
        address: shareAddress,
      }),
    queryKey: [
      ...earnPositionsKeyPrefix,
      networkType,
      account,
      shareAddress,
      'shareBalance',
    ],
  })

export const fetchEarnPositions = async function ({
  account,
  networkType,
  queryClient,
}: {
  account: Address
  networkType: string
  queryClient: QueryClient
}): Promise<EarnPosition[]> {
  const shares = await queryClient.ensureQueryData(
    hemiEarnSharesQueryOptions({ queryClient }),
  )

  // Use `allSettled` so a single failing share-balance read doesn't take down
  // the whole composition: matches the previous `useQueries` behavior where
  // the hook only escalated to an error state if *every* read failed.
  //
  // `fetchQuery` (instead of `ensureQueryData`) is load-bearing: deposit/
  // withdraw flows invalidate `earnPositionsKeyPrefix` on `onSettled`, which
  // marks these reads as stale but doesn't evict them. `ensureQueryData`
  // returns stale cache even with `revalidateIfStale: true` (the latter only
  // schedules a background prefetch), so the staked-balance card stayed on
  // the pre-deposit value until a hard refresh. `fetchQuery` actually waits
  // for fresh data when the query is stale.
  const settled = await Promise.allSettled(
    shares.map(share =>
      queryClient
        .fetchQuery(
          shareBalanceQueryOptions({
            account,
            networkType,
            shareAddress: share.shareAddress,
          }),
        )
        .then(balance => ({ balance, share })),
    ),
  )

  const fulfilled = settled.filter(
    (
      r,
    ): r is PromiseFulfilledResult<{
      balance: bigint
      share: (typeof shares)[number]
    }> => r.status === 'fulfilled',
  )

  if (shares.length > 0 && fulfilled.length === 0) {
    throw new Error('All share balance reads failed')
  }

  return fulfilled
    .map(r => r.value)
    .filter(({ balance }) => balance > BigInt(0))
    .map(({ balance, share }) => ({
      peggedToken: share.peggedToken,
      shareAddress: share.shareAddress,
      shareToken: share.shareToken,
      yourDeposit: balance,
    }))
}
