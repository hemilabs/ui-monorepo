import { useQueries } from '@tanstack/react-query'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useHemiToken } from 'hooks/useHemiToken'
import { isDataUnavailable } from 'utils/queryStatus'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'

import { getCalculateRewardsQueryOptions } from './useCalculateRewards'
import { useEpochClaimableByToken } from './useEpochClaimableByToken'
import { useEpochSystemState } from './useEpochSystemState'
import { useRewardTokens } from './useRewardTokens'

/**
 * Whether a position has anything to collect, or `undefined` where that is not known yet.
 *
 * The third state matters: a read still in flight, never run, or failed is not the same
 * as a position owing nothing, and collapsing them tells a holder there are no rewards
 * before we have looked. On the epoch generation that window is two sequential round
 * trips, since the claimable read waits on the system state.
 */
export function useHasRewards(tokenId: bigint) {
  const token = useHemiToken()
  const { hemiWalletClient } = useHemiWalletClient()
  const {
    hasError: hasRewardTokensError,
    isPending: isRewardTokensPending,
    tokens: rewardTokens,
  } = useRewardTokens()
  const isEpochGeneration = getRewardsGeneration(token.chainId) === 'epoch'
  const epochClaimable = useEpochClaimableByToken(tokenId)
  const { status: systemStateStatus } = useEpochSystemState()

  const legacy = useQueries({
    combine: results => ({
      // An empty result set is not an answer: while the token list loads there are no
      // queries to combine, and `every` over nothing is true - which would report
      // "nothing to claim" on every first paint.
      hasRewards:
        isRewardTokensPending || hasRewardTokensError
          ? undefined
          : results.some(({ data }) => (data ?? BigInt(0)) > BigInt(0))
            ? true
            : results.every(result => result.data !== undefined)
              ? false
              : undefined,
      isRewardsUnavailable:
        hasRewardTokensError || results.some(isDataUnavailable),
      // Assets this position holds a balance in, not assets the contract has registered.
      // The caption is a count of money.
      rewardsWithBalance:
        isRewardTokensPending ||
        hasRewardTokensError ||
        !results.every(result => result.data !== undefined)
          ? undefined
          : results.filter(({ data }) => (data ?? BigInt(0)) > BigInt(0))
              .length,
    }),
    queries: isEpochGeneration
      ? []
      : rewardTokens.map(({ address }) =>
          getCalculateRewardsQueryOptions({
            chainId: token.chainId,
            hemiWalletClient,
            rewardToken: address,
            tokenId,
          }),
        ),
  })

  // The same Lens read the amounts come from, so the menu item and the figure beside it
  // can't disagree about whether there is anything to collect.
  return isEpochGeneration
    ? {
        hasRewards:
          epochClaimable.data === undefined
            ? undefined
            : epochClaimable.data.some(entry => entry.claimable > BigInt(0)),
        // The claimable read is a second hop and sits disabled - pending and idle -
        // until the system state resolves. That is an ordinary load, so only a read that
        // actually failed counts as unavailable.
        isRewardsUnavailable:
          systemStateStatus === 'error' ||
          (systemStateStatus === 'success' &&
            isDataUnavailable(epochClaimable)),
        rewardsWithBalance:
          epochClaimable.data === undefined
            ? undefined
            : epochClaimable.data.filter(entry => entry.claimable > BigInt(0))
                .length,
      }
    : legacy
}
