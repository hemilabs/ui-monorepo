import Big from 'big.js'
import {
  RewardSource,
  type ClaimableReward,
  type ClaimTransaction,
  type RewardSourceType,
} from 'types/stakingDashboard'
import { type EvmToken } from 'types/token'
import { getTokenPrice } from 'utils/token'
import { getClaimSpan } from 've-hemi-epoch-rewards'
import { formatUnits, isAddressEqual, type Address } from 'viem'

import { findRewardToken } from './rewardToken'

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
 * still outstanding. Each transaction keeps what its window pays, so the claim can be
 * ordered by value.
 */
export const getClaimTransactions = (
  windows: {
    fromEpoch: number
    rewards: ClaimableReward[]
    toEpoch: number
  }[],
  source: RewardSourceType = RewardSource.EPOCH,
): (ClaimTransaction & { rewards: ClaimableReward[] })[] =>
  windows
    .filter(({ rewards }) => rewards.some(({ amount }) => amount > BigInt(0)))
    .map(({ fromEpoch, rewards, toEpoch }) => ({
      fromEpoch,
      rewards,
      source,
      toEpoch,
    }))

const getClaimValue = function ({
  hemiTokenAddress,
  prices,
  rewards,
  tokens,
}: {
  hemiTokenAddress: Address
  prices: Record<string, string> | undefined
  rewards: ClaimableReward[]
  tokens: EvmToken[]
}) {
  const toUnits = (reward: ClaimableReward) =>
    Big(formatUnits(reward.amount, reward.decimals))

  if (!prices) {
    return rewards
      .filter(reward => isAddressEqual(reward.token, hemiTokenAddress))
      .reduce((total, reward) => total.plus(toUnits(reward)), Big(0))
  }

  // A reward token without a known price (or token metadata) counts as $0. This
  // undervalues the windows that pay it, so they may be claimed later than they
  // should.
  // TODO improve the valuation of reward tokens that have no price.
  return rewards.reduce(function (total, reward) {
    const token = findRewardToken(tokens, reward.token)
    return token
      ? total.plus(toUnits(reward).times(getTokenPrice(token, prices)))
      : total
  }, Big(0))
}

/**
 * The claims in the order they should be sent: the most valuable window first.
 *
 * A claim run stops at the first transaction that is rejected or reverts, so sending the
 * valuable windows first keeps a partial run from paying gas for the small ones only.
 * Every window is ranked on its own, across positions; the contract tracks claims per
 * epoch, so windows can be claimed in any order.
 *
 * Windows are valued in USD across every reward token. Without prices, they are ranked
 * by their HEMI amount instead. Ties keep the position order, then the epoch order.
 */
export const sortClaimsByValue = <
  T extends { fromEpoch: number; rewards: ClaimableReward[]; tokenId: bigint },
>({
  claims,
  hemiTokenAddress,
  prices,
  tokens,
}: {
  claims: T[]
  hemiTokenAddress: Address
  prices: Record<string, string> | undefined
  tokens: EvmToken[]
}) =>
  claims
    .map(claim => ({
      claim,
      value: getClaimValue({
        hemiTokenAddress,
        prices,
        rewards: claim.rewards,
        tokens,
      }),
    }))
    .sort(function (a, b) {
      const byValue = b.value.cmp(a.value)
      if (byValue !== 0) {
        return byValue
      }
      if (a.claim.tokenId !== b.claim.tokenId) {
        return a.claim.tokenId < b.claim.tokenId ? -1 : 1
      }
      return a.claim.fromEpoch - b.claim.fromEpoch
    })
    .map(({ claim }) => claim)

/**
 * The windows after one of them has been claimed: its rewards are zeroed, so it
 * no longer counts as claimable. Lets the cache reflect a confirmed claim
 * without waiting for a re-read.
 */
export const markClaimWindowAsClaimed = <
  T extends { fromEpoch: number; rewards: ClaimableReward[]; toEpoch: number },
>(
  windows: T[],
  claimed: Pick<ClaimTransaction, 'fromEpoch' | 'toEpoch'>,
) =>
  windows.map(window =>
    window.fromEpoch === claimed.fromEpoch && window.toEpoch === claimed.toEpoch
      ? {
          ...window,
          rewards: window.rewards.map(r => ({ ...r, amount: BigInt(0) })),
        }
      : window,
  )
