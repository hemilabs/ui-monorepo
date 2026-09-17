import type { ClaimRewardTotal } from 'types/stakingDashboard'
import type { ClaimedTotal } from 've-hemi-rewards/actions'

type Asset = { address: string; decimals: number; symbol: string }

/**
 * What has already been paid, per reward asset.
 *
 * Amounts are summed across events: one claim is signed in chunks, each emitting its own
 * `Claimed` over a disjoint epoch range. Assets are keyed by address, since a claim
 * settles every registered asset and the registry mixes decimals.
 *
 * Assets nothing was ever paid in are left out rather than shown as zero - a history of
 * zeros is noise, and "nothing yet" is said once by the section not rendering at all.
 */
export const claimedTotals = function ({
  assets,
  rows,
  tokenId,
}: {
  assets: readonly Asset[]
  rows: readonly ClaimedTotal[] | undefined
  // Narrows to one position. Omitted, this totals every position the rows cover.
  tokenId?: bigint
}): ClaimRewardTotal[] {
  if (rows === undefined) {
    return []
  }

  const paid = new Map<string, bigint>()
  rows
    .filter(row => tokenId === undefined || row.tokenId === tokenId)
    .forEach(function ({ amount, token }) {
      const key = token.toLowerCase()
      paid.set(key, (paid.get(key) ?? BigInt(0)) + amount)
    })

  // Ordered by the asset list rather than by first payment, so the history reads in the
  // same order as the claimable figures above it.
  return assets.flatMap(function (asset) {
    const claimable = paid.get(asset.address.toLowerCase()) ?? BigInt(0)
    return claimable > BigInt(0)
      ? [
          {
            claimable,
            decimals: asset.decimals,
            symbol: asset.symbol,
            token: asset.address,
          },
        ]
      : []
  })
}
