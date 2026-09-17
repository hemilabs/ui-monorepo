import {
  RewardSource,
  type ClaimableReward,
  type ClaimTransaction,
  type RewardSourceType,
} from 'types/stakingDashboard'
import { getClaimSpan } from 've-hemi-epoch-rewards'
import { type Address } from 'viem'

/**
 * One row per reward token, adding up what every source owes for it.
 *
 * Two sources paying the same token are one line to the holder, so the amounts are
 * summed and the source of the first row is kept for the claim plan to key on.
 */
export const mergeClaimableRewards = function (
  lists: ClaimableReward[][],
): ClaimableReward[] {
  const byToken = lists.flat().reduce(function (totals, reward) {
    const running = totals.get(reward.token)
    totals.set(reward.token, {
      ...(running ?? reward),
      amount: (running?.amount ?? BigInt(0)) + reward.amount,
    })
    return totals
  }, new Map<Address, ClaimableReward>())

  return [...byToken.values()]
}

/**
 * The epoch windows a claim is split into.
 *
 * `claim` is bounded by epoch x reward token pairs, so the widest window narrows as the
 * registry grows.
 */
export const getClaimWindows = function ({
  fromEpoch,
  maxClaimEpochs,
  maxClaimPairs,
  toEpoch,
  tokenCount,
}: {
  fromEpoch: number
  maxClaimEpochs: number
  maxClaimPairs: number
  toEpoch: number
  tokenCount: number
}) {
  if (toEpoch < fromEpoch) {
    return []
  }

  const span = getClaimSpan({ maxClaimEpochs, maxClaimPairs, tokenCount })

  return Array.from(
    { length: Math.ceil((toEpoch - fromEpoch + 1) / span) },
    function (_, index) {
      const from = fromEpoch + index * span
      return { fromEpoch: from, toEpoch: Math.min(from + span - 1, toEpoch) }
    },
  )
}

/**
 * How many transactions a claim needs, and which range each one covers.
 *
 * Windows owing nothing are left out: the holder is never asked to sign for an epoch
 * range that pays them zero, and a retry after a partial claim only re-sends what is
 * still outstanding.
 */
export const getClaimTransactions = (
  windows: {
    fromEpoch: number
    rewards: ClaimableReward[]
    toEpoch: number
  }[],
  source: RewardSourceType = RewardSource.EPOCH,
): ClaimTransaction[] =>
  windows
    .filter(({ rewards }) => rewards.some(({ amount }) => amount > BigInt(0)))
    .map(({ fromEpoch, toEpoch }) => ({ fromEpoch, source, toEpoch }))
