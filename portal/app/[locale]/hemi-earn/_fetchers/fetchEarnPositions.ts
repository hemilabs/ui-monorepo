import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { hemi } from 'hemi-viem'
import { getPublicClient } from 'utils/chainClients'
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
      balanceOf(getPublicClient(hemi.id), {
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
  const shares = await queryClient.ensureQueryData(hemiEarnSharesQueryOptions())

  // allSettled so one failing balance read doesn't sink the whole set (escalate only if all fail).
  // ensureQueryData serves cache; withdraw/settle and the delivery watcher reset earnPositionsKeyPrefix for freshness.
  const settled = await Promise.allSettled(
    shares.map(share =>
      queryClient
        .ensureQueryData(
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
